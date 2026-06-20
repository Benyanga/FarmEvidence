import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTrialContext } from '../../context/TrialContext';

const HELP_CONTENT = {
  en: {
    title: 'Farmer Help Center',
    subtitle: 'Learn how to use FarmEvidence for farm tracking and profitability analysis.',
    sections: [
      {
        id: 'getting-started',
        title: 'Getting Started',
        content: 'Welcome to FarmEvidence! This app helps you track your farm costs and profitability. Start by setting up your farm details in the Setup tab.',
      },
      {
        id: 'setup',
        title: 'Farm Setup',
        content: 'In Setup, enter your farm name, location, and basic crop information. This information will be used across all seasons and trials.',
      },
      {
        id: 'data-entry',
        title: 'Data Entry',
        content: 'Record your input costs, labour costs, yield, and farm conditions for each season. Enter data as accurately as possible for better analysis.',
      },
      {
        id: 'comparison',
        title: 'Season Comparison',
        content: 'Compare results across multiple seasons to identify trends in profitability, yield, and cost efficiency. Look for patterns to improve your farming practices.',
      },
      {
        id: 'reports',
        title: 'Reports',
        content: 'Generate and download reports for your records. Reports include cost summaries, profitability analysis, and recommendations based on your data.',
      },
      {
        id: 'faq',
        title: 'Frequently Asked Questions',
        content: 'Q: How do I export my data? A: Use the Download Report button on the Reports page. Q: Can I edit past entries? A: Yes, navigate to the season and plot to edit any recorded data.',
      },
    ],
  },
  kin: {
    title: 'Ubufasha bw\'umuhinzi',
    subtitle: 'Iga uko ungukoresha FarmEvidence kugirango ukurinde amafaranga n\'inyungu z\'ubutaka bwawe.',
    sections: [
      {
        id: 'getting-started',
        title: 'Gutangira',
        content: 'Mwakulohereza muri FarmEvidence! Iki gihingwa kigucira igiciro cy\'ibikoreswa n\'inyungu z\'ubutaka. Tangira mukugereza amakuru y\'ubutaka muri Setup.',
      },
      {
        id: 'setup',
        title: 'Igenamiterere y\'ubutaka',
        content: 'Mu igenamiterere, winjiza izina ry\'ubutaka, aho giherereye, n\'amakuru y\'agasaruro. Iyi makuru izakoreshwa mumasason yose.',
      },
      {
        id: 'data-entry',
        title: 'Kwinjiza amakuru',
        content: 'Nota amafaranga y\'ibiribwa, amafaranga y\'akazi, umusaruro, n\'imiterere y\'ubutaka kuri buri gihembwe. Injiza amakuru neza kugirango ubwonere isesengura neza.',
      },
      {
        id: 'comparison',
        title: 'Kugereranya ibihembwe',
        content: 'Gereranya ibisubizo mu masason atandukanye kugirango urebe inzira z\'inyungu, umusaruro, n\'imishinga. Reba imiterere kugirango wibwirizure ubuhinzi.',
      },
      {
        id: 'reports',
        title: 'Raporo',
        content: 'Kureka raporo kandi kuramo PDF ya raporo. Raporo zirimo isesengura ry\'amafaranga, inyungu, n\'amasahasi based ku makuru yawe.',
      },
      {
        id: 'faq',
        title: 'Ibibazo bikunze kubazwa',
        content: 'U: Nigute ndera amakuru? J: Shira na Download Report button. U: Niba nta ririko kugushyira ku bijyanye n\'ibigize? J: Yego, wiyongere wizira igihe kinaheje cyo kureba amakuru.',
      },
    ],
  },
};

export default function FarmerHelp() {
  const { lang } = useTrialContext();
  const [expandedId, setExpandedId] = useState(null);

  const currentLang = lang === 'kin' ? 'kin' : 'en';
  const content = HELP_CONTENT[currentLang];

  const toggleExpanded = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">{content.title}</h1>
        <p className="text-lg text-slate-600">{content.subtitle}</p>
      </div>

      {/* Help Sections */}
      <div className="space-y-4">
        {content.sections.map((section) => (
          <div key={section.id} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <button
              onClick={() => toggleExpanded(section.id)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
            >
              <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
              <ChevronDown
                className={`h-5 w-5 text-slate-500 transition-transform ${
                  expandedId === section.id ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedId === section.id && (
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                <p className="text-slate-700 leading-relaxed">{section.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact Section */}
      <div className="mt-12 p-6 bg-emerald-50 rounded-lg border border-emerald-200">
        <h3 className="font-semibold text-emerald-900 mb-2">
          {currentLang === 'kin' ? 'Kwiyishyuramazina' : 'Still Need Help?'}
        </h3>
        <p className="text-emerald-800">
          {currentLang === 'kin'
            ? 'Kontakta umwanya FarmEvidence kugirango ubone ubufasha bwakunzira.'
            : 'Contact your extension officer or trainer for additional support.'}
        </p>
      </div>
    </div>
  );
}
