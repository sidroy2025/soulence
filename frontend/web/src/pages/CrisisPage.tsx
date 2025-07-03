import React from 'react';
import { useWellnessStore } from '../stores/wellnessStore';
import { Layout } from '../components/Layout';
import { 
  Phone, 
  MessageCircle, 
  Heart, 
  ExternalLink,
  AlertTriangle,
  Users,
  Clock
} from 'lucide-react';

export const CrisisPage: React.FC = () => {
  const { crisisResources, loadCrisisResources } = useWellnessStore();

  React.useEffect(() => {
    loadCrisisResources();
  }, [loadCrisisResources]);

  const emergencyContacts = [
    {
      name: "Emergency Services",
      number: "911",
      description: "For immediate life-threatening emergencies",
      available: "24/7",
      type: "emergency"
    },
    {
      name: "National Suicide Prevention Lifeline",
      number: "988",
      description: "Free and confidential emotional support",
      available: "24/7",
      type: "crisis"
    },
    {
      name: "Crisis Text Line",
      number: "Text HOME to 741741",
      description: "Free, 24/7 crisis support via text",
      available: "24/7",
      type: "text"
    }
  ];

  const copingStrategies = [
    "Take slow, deep breaths (4 counts in, 4 counts hold, 4 counts out)",
    "Ground yourself: name 5 things you can see, 4 you can hear, 3 you can touch",
    "Reach out to a trusted friend, family member, or counselor",
    "Try progressive muscle relaxation",
    "Listen to calming music or nature sounds",
    "Write down your feelings in a journal",
    "Take a warm bath or shower",
    "Go for a walk in fresh air",
    "Practice mindfulness or meditation",
    "Engage in a creative activity"
  ];

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Heart className="h-8 w-8 mr-3 text-red-500" />
            Crisis Support & Resources
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            You're not alone. Help is available 24/7.
          </p>
        </div>

        {/* Emergency Notice */}
        <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-red-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-red-900 mb-2">
                If you're in immediate danger
              </h2>
              <p className="text-red-800 mb-4">
                If you're having thoughts of hurting yourself or others, or if you're in immediate danger, 
                please call 911 or go to your nearest emergency room right away.
              </p>
              <a
                href="tel:911"
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call 911 Now
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Crisis Hotlines */}
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Phone className="h-6 w-6 mr-2 text-blue-600" />
                Crisis Hotlines
              </h2>
              
              <div className="space-y-4">
                {emergencyContacts.map((contact, index) => (
                  <div 
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                        <p className="text-lg font-mono text-primary-600 my-1">{contact.number}</p>
                        <p className="text-sm text-gray-600 mb-2">{contact.description}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {contact.available}
                        </div>
                      </div>
                      <div className="ml-4">
                        {contact.type === 'text' ? (
                          <MessageCircle className="h-5 w-5 text-blue-500" />
                        ) : (
                          <Phone className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Resources */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <ExternalLink className="h-6 w-6 mr-2 text-purple-600" />
                Additional Resources
              </h2>
              
              <div className="space-y-3">
                <a 
                  href="https://www.nami.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">NAMI (National Alliance on Mental Illness)</h4>
                      <p className="text-sm text-gray-600">Support groups and educational resources</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                </a>
                
                <a 
                  href="https://www.mentalhealth.gov" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">MentalHealth.gov</h4>
                      <p className="text-sm text-gray-600">Government mental health resources</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                </a>
                
                <a 
                  href="https://www.samhsa.gov/find-help/national-helpline" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">SAMHSA National Helpline</h4>
                      <p className="text-sm text-gray-600">1-800-662-4357 (Treatment referrals)</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Coping Strategies */}
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Users className="h-6 w-6 mr-2 text-green-600" />
                Immediate Coping Strategies
              </h2>
              
              <div className="space-y-3">
                {copingStrategies.map((strategy, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-gray-700">{strategy}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Plan */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Your Safety Plan</h2>
              <p className="text-gray-700 mb-4">
                A safety plan is a personalized guide that helps you recognize warning signs and know what to do in a crisis.
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• List your personal warning signs</p>
                <p>• Identify coping strategies that work for you</p>
                <p>• Contact information for support people</p>
                <p>• Professional contacts and emergency numbers</p>
                <p>• Ways to make your environment safe</p>
              </div>
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Download Safety Plan Template
              </button>
            </div>

            {/* Remember */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-100 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Remember</h2>
              <ul className="space-y-2 text-gray-700">
                <li>• You are not alone in this struggle</li>
                <li>• Your feelings are valid and temporary</li>
                <li>• Asking for help is a sign of strength</li>
                <li>• There are people who care about you</li>
                <li>• Recovery is possible with the right support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};