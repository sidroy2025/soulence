import { v4 as uuidv4 } from 'uuid';
import { Database, AuthUtils, NotFoundError, AuthorizationError } from '@soulence/utils';
import { UserProfile, UserConsent } from '@soulence/models';

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const query = `
    SELECT u.id, u.email, u.role, u.created_at, u.is_verified,
           p.first_name, p.last_name, p.date_of_birth, p.grade, p.school,
           p.parent_emails, p.therapist_id, p.preferences
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE u.id = $1
  `;
  
  const result = await Database.query(query, [userId]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  return {
    userId: row.id,
    email: row.email,
    role: row.role,
    firstName: row.first_name,
    lastName: row.last_name,
    dateOfBirth: row.date_of_birth,
    grade: row.grade,
    school: row.school,
    parentEmails: row.parent_emails,
    therapistId: row.therapist_id,
    preferences: row.preferences || {
      notifications: true,
      dailyReminders: true,
      crisisAlerts: true,
      dataSharing: {
        mood: false,
        academic: false,
        ai_interactions: false
      }
    }
  };
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  const allowedFields = ['first_name', 'last_name', 'date_of_birth', 'grade', 'school', 'preferences'];
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;
  
  for (const [key, value] of Object.entries(updates)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    if (allowedFields.includes(snakeKey)) {
      updateFields.push(`${snakeKey} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  }
  
  if (updateFields.length === 0) {
    return getUserProfile(userId) as Promise<UserProfile>;
  }
  
  values.push(userId);
  
  const query = `
    INSERT INTO user_profiles (user_id, ${updateFields.map(f => f.split(' = ')[0]).join(', ')})
    VALUES ($${paramCount}, ${values.slice(0, -1).map((_, i) => `$${i + 1}`).join(', ')})
    ON CONFLICT (user_id) DO UPDATE SET
    ${updateFields.join(', ')},
    updated_at = NOW()
    RETURNING *
  `;
  
  await Database.query(query, values);
  
  return getUserProfile(userId) as Promise<UserProfile>;
}

export async function verifyUserPassword(userId: string, password: string): Promise<boolean> {
  const query = `SELECT password_hash FROM users WHERE id = $1`;
  const result = await Database.query(query, [userId]);
  
  if (result.rows.length === 0) {
    return false;
  }
  
  return AuthUtils.verifyPassword(password, result.rows[0].password_hash);
}

export async function deleteUser(userId: string): Promise<void> {
  await Database.transaction(async (client) => {
    // Delete related data in correct order
    await client.query('DELETE FROM user_consents WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM user_profiles WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
  });
}

export async function getUserConsents(userId: string): Promise<UserConsent[]> {
  const query = `
    SELECT id, user_id, data_type, shared_with, granted_at, expires_at
    FROM user_consents
    WHERE user_id = $1
    ORDER BY granted_at DESC
  `;
  
  const result = await Database.query(query, [userId]);
  return result.rows;
}

export async function createConsent(
  userId: string,
  dataType: string,
  sharedWith: string,
  expiresAt?: Date
): Promise<UserConsent> {
  const id = uuidv4();
  
  const query = `
    INSERT INTO user_consents (id, user_id, data_type, shared_with, granted_at, expires_at)
    VALUES ($1, $2, $3, $4, NOW(), $5)
    RETURNING *
  `;
  
  const result = await Database.query(query, [id, userId, dataType, sharedWith, expiresAt]);
  return result.rows[0];
}

export async function revokeConsent(userId: string, consentId: string): Promise<void> {
  const query = `
    DELETE FROM user_consents
    WHERE id = $1 AND user_id = $2
  `;
  
  const result = await Database.query(query, [consentId, userId]);
  
  if (result.rowCount === 0) {
    throw new NotFoundError('Consent');
  }
}

export async function getLinkedChildren(parentId: string): Promise<any[]> {
  const query = `
    SELECT u.id, u.email, u.role, p.first_name, p.last_name, p.grade
    FROM parent_child_links pcl
    JOIN users u ON u.id = pcl.child_id
    LEFT JOIN user_profiles p ON p.user_id = u.id
    WHERE pcl.parent_id = $1 AND pcl.is_active = true
  `;
  
  const result = await Database.query(query, [parentId]);
  return result.rows;
}

export async function linkParentToChild(
  parentId: string,
  childId: string,
  verificationCode: string
): Promise<void> {
  // Verify the code (in production, this would be more sophisticated)
  const isValid = await verifyLinkingCode(childId, verificationCode);
  
  if (!isValid) {
    throw new AuthorizationError('Invalid verification code');
  }
  
  const query = `
    INSERT INTO parent_child_links (parent_id, child_id, linked_at, is_active)
    VALUES ($1, $2, NOW(), true)
    ON CONFLICT (parent_id, child_id) DO UPDATE SET
    is_active = true,
    linked_at = NOW()
  `;
  
  await Database.query(query, [parentId, childId]);
}

export async function getTherapistPatients(therapistId: string): Promise<any[]> {
  const query = `
    SELECT u.id, u.email, p.first_name, p.last_name, p.grade,
           tp.assigned_at, tp.notes
    FROM therapist_patient_links tp
    JOIN users u ON u.id = tp.patient_id
    LEFT JOIN user_profiles p ON p.user_id = u.id
    WHERE tp.therapist_id = $1 AND tp.is_active = true
    ORDER BY tp.assigned_at DESC
  `;
  
  const result = await Database.query(query, [therapistId]);
  return result.rows;
}

export async function getAllUsers(options: { page: number; limit: number; role?: string }): Promise<any> {
  const offset = (options.page - 1) * options.limit;
  let whereClause = '';
  const values: any[] = [options.limit, offset];
  
  if (options.role) {
    whereClause = 'WHERE role = $3';
    values.push(options.role);
  }
  
  const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
  const dataQuery = `
    SELECT id, email, role, created_at, is_verified, last_login
    FROM users
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `;
  
  const [countResult, dataResult] = await Promise.all([
    Database.query(countQuery, options.role ? [options.role] : []),
    Database.query(dataQuery, values)
  ]);
  
  return {
    users: dataResult.rows,
    total: parseInt(countResult.rows[0].count),
    page: options.page,
    totalPages: Math.ceil(parseInt(countResult.rows[0].count) / options.limit)
  };
}

async function verifyLinkingCode(childId: string, code: string): Promise<boolean> {
  // In production, implement proper verification logic
  // This could involve checking a temporary code stored in Redis
  return true;
}