import { useState } from 'react';
import { useTrialContext } from '../../context/TrialContext';
import { ChevronDown, ChevronUp } from 'lucide-react';

const COPY = {
  en: {
    title: 'Farmer Help',
    intro: 'Find simple guidance for recording data, understanding results, and getting support for your farm.',
    sections: [
      {
        title: 'Getting Started',
        items: [
          {
            heading: 'What is FarmEvidence?',
            text: 'FarmEvidence is a farmer-friendly app for recording your season, tracking costs and harvest, and seeing what your farm is earning.',
          },
          {
            heading: 'How to register your farm',
            text: 'Use the Setup page to add your farm details, including location, crop, and season. This helps keep your records organized and ready for analysis.',
          },
          {
            heading: 'How to record your season\'s data',
            text: 'After registering your farm, open the data entry page and fill in your seed, fertiliser, labour and harvest information for the season.',
          },
        ],
      },
      {
        title: 'Recording Your Data',
        items: [
          {
            heading: 'What to record after buying inputs',
            text: 'Write down the cost of seeds, fertiliser, mulch and other inputs when you buy them so your farm economics are accurate.',
          },
          {
            heading: 'How to record labour',
            text: 'Record both your own work and hired workers. Note time spent on each task and the amount paid for hired labour.',
          },
          {
            heading: 'When to record your harvest',
            text: 'Record harvest quantities after the crop is collected and ready for market. This gives the clearest picture of your season\'s results.',
          },
        ],
      },
      {
        title: 'Understanding Your Results',
        items: [
          {
            heading: 'What Net Benefit means',
            text: 'Net Benefit is the money left after paying for seeds, fertiliser, labour and other costs. It shows whether the season made a profit.',
          },
          {
            heading: 'What Break-Even means',
            text: 'Break-Even is the minimum harvest you need to not lose money. If your harvest is above this amount, you start earning profit.',
          },
          {
            heading: 'What the Phase means',
            text: 'The Phase shows your farm\'s journey: whether it is transitioning, stabilizing, or reaching maturity with the chosen practices.',
          },
        ],
      },
      {
        title: 'Comparing Seasons',
        items: [
          {
            heading: 'Same crop for profit comparison',
            text: 'We compare profit only for seasons that grow the same crop so the comparison is fair and useful.',
          },
          {
            heading: 'Soil health comparisons',
            text: 'Soil health can be compared across any seasons because it shows how the land is improving over time.',
          },
        ],
      },
      {
        title: 'Getting Help',
        items: [
          {
            heading: 'Contact support',
            text: 'If you need help, use the contact details provided by your program or ask your extension officer for assistance.',
          },
        ],
      },
    ],
  },
  kin: {
    title: 'Ubufasha ku Muhinzi',
    intro: 'Shakisha amabwiriza yoroshye yo kwandika amakuru, gusobanukirwa ibisubizo, no kubona ubufasha ku murima wawe.',
    sections: [
      {
        title: 'Kugira ngo utangire',
        items: [
          {
            heading: 'FarmEvidence ni iki?',
            text: 'FarmEvidence ni porogaramu yoroshye ku bahinzi yo kwandika igihembwe, gukurikirana ibiciro n\'umusaruro, no kureba amafaranga umusaruro wawe winjiza.',
          },
          {
            heading: 'Uko wiyandikisha ubutaka bwawe',
            text: 'Koresha urupapuro rwa Setup wongereho amakuru y\'ubutaka, aho giherereye, umusaruro n\'igihembwe. Ibi bifasha gutunganya amakuru yawe neza.',
          },
          {
            heading: 'Uko wandika amakuru y\'igihembwe',
            text: 'Nyuma yo kwiyandikisha ubutaka, fungura urupapuro rwo kwinjiza amakuru maze wuzuze igiciro cy\'imbuto, ifumbire, umurimo n\'umusaruro w\'ikihembwe.',
          },
        ],
      },
      {
        title: 'Kwandika Amakuru Yawe',
        items: [
          {
            heading: 'Ibyo ugomba kwandika nyuma yo kugura ibikoresho',
            text: 'Andika igiciro cy\'imbuto, ifumbire, mulch n\'ibindi uko ubigura kugira ngo imibare y\'ubukungu bw\'ubutaka bwawe ibe nyayo.',
          },
          {
            heading: 'Uko wandika umurimo',
            text: 'Andika akazi kawe ndetse n\'akandi wakodesheje. Shyiramo igihe bakoze n\'amafaranga y\'abakozi wabahaye.',
          },
          {
            heading: 'Igihe cyo kwandika umusaruro',
            text: 'Andika umusaruro nyuma yo gusarura no kuwugaburira, ukoreshya ibipimo bisanzwe. Ibi bitanga ishusho nyayo y\'igihembwe.',
          },
        ],
      },
      {
        title: 'Gusobanukirwa Ibisubizo',
        items: [
          {
            heading: 'Net Benefit bisobanura iki',
            text: 'Net Benefit ni amafaranga asigara nyuma yo kwishyura imbuto, ifumbire, akazi n\'ibindi bikoresho. Igaragaza niba igihembwe cyungutse.',
          },
          {
            heading: 'Break-Even bisobanura iki',
            text: 'Break-Even ni umusaruro ntarengwa ugomba kugira ngo udahomba. Iyo umusaruro uruta uwo, utangira kunguka.',
          },
          {
            heading: 'Icyo Icyiciro kibwira urugendo rwawe',
            text: 'Icyiciro kigaragaza urugendo rw\'ubutaka bwawe: niba biri mu guhinduka, kwiyubaka, cyangwa kugera ku rwego ruhanitse ku buryo bwo guhinga.',
          },
        ],
      },
      {
        title: 'Kugereranya Ibihembwe',
        items: [
          {
            heading: 'Kugereranya inyungu ku musaruro umwe',
            text: 'Dukora kugereranya inyungu gusa ku bihembwe bibayeho hakoreshejwe umusaruro umwe kugira ngo ugereranyo abe urimo uburinganire.',
          },
          {
            heading: 'Imiterere y\'ubutaka ishobora kugereranywa',
            text: 'Imiterere y\'ubutaka ishobora kugereranywa ku bihembwe byose kuko igaragaza uburyo ubutaka bwiyubaka mu gihe.',
          },
        ],
      },
      {
        title: 'Gushaka Ubufasha',
        items: [
          {
            heading: 'Amakuru yo kuvugana',
            text: 'Niba ukeneye ubufasha, koresha amakuru y\'itumanaho atangwa na gahunda yawe cyangwa usabe umujyanama wawe ubufasha.',
          },
        ],
      },
    ],
  },
};

export default function FarmerHelp() {
  const { lang } = useTrialContext();
  const copy = lang === 'kin' ? COPY.kin : COPY.en;
  const [openSection, setOpenSection] = useState('Getting Started');

  const toggleSection = (title) => {
    setOpenSection((current) => (current === title ? '' : title));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold text-slate-900">{copy.title}</h1>
            <p className="max-w-3xl text-lg leading-8 text-slate-600">{copy.intro}</p>
          </div>
        </div>

        <div className="space-y-4">
          {copy.sections.map((section) => {
            const isOpen = openSection === section.title;
            return (
              <div key={section.title} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  aria-expanded={isOpen}
                  aria-controls={`section-${section.title.replace(/\s+/g, '-')}`}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-lg font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  <span>{section.title}</span>
                  <span className="flex items-center gap-2 text-slate-500">
                    {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </span>
                </button>
                <div
                  id={`section-${section.title.replace(/\s+/g, '-')}`}
                  className={`px-6 pb-6 transition-all duration-300 ${isOpen ? 'block' : 'hidden'}`}
                >
                  <div className="space-y-5 pt-4 text-slate-700">
                    {section.items.map((item) => (
                      <div key={item.heading} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <h2 className="text-xl font-semibold text-slate-900">{item.heading}</h2>
                        <p className="mt-3 leading-7 text-slate-600">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
