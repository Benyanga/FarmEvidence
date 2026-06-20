export const messageTemplates = {
  rule1: {
    en: {
      WHAT: "A profit summary has been generated for the current season.",
      WHY: "To provide an overview of the financial performance of your farming operations.",
      HOW: "By calculating total revenue minus total costs based on entered data.",
      RECOMMENDATION: "Review the profit figures and consider strategies to optimize costs or increase revenue."
    },
    rw: {
      WHAT: "Incamake y'inyungu y'iki gihembwe yakozwe.",
      WHY: "Gutanga incamake y'imikorere y'imari y'ubuhinzi bwawe.",
      HOW: "Kubara inyungu zose minus ibiciro byose bivuye mu makuru yinjijwe.",
      RECOMMENDATION: "Soma incamake y'inyungu kandi witegereze uburyo bwo kunoza ibiciro cyangwa kwiyongera inyungu."
    }
  },
  rule2: {
    en: {
      WHAT: "Profit has declined for at least two consecutive seasons.",
      WHY: "This trend may indicate underlying issues affecting farm profitability.",
      HOW: "By comparing profit figures across multiple seasons.",
      RECOMMENDATION: "Investigate cost increases or yield reductions and implement corrective measures."
    },
    rw: {
      WHAT: "Inyungu yagabanutse mu bihembwe bibiri cyangwa birenga.",
      WHY: "Iyi myifatire ishobora kugaragaza ibibazo bikomereye inyungu z'ubuhinzi.",
      HOW: "Kugereranya incamake y'inyungu mu bihembwe byinshi.",
      RECOMMENDATION: "Shakisha ibiciro byiyongereye cyangwa umusaruro ugabanutse kandi ukore ibikorwa byo kugorora."
    }
  },
  rule3: {
    en: {
      WHAT: "Weed-yield-profit chain detected (dynamic template).",
      WHY: "Weed competition reduces crop competitiveness during critical growth stages.",
      HOW: "Field conditions translate to economic outcomes through agronomic mechanisms.",
      RECOMMENDATION: "Review specific WHAT/WHY/HOW/REC values injected from agronomic and financial data."
    },
    rw: {
      WHAT: "Ibyatsi-umusaruro-inyungu chain igaragazwe (dynamic template).",
      WHY: "Ibyatsi bigabanya ubushobozi bwo guhangana n'ibihingwa mu gihe cyumvikire.",
      HOW: "Imiterere y'ubutaka yatandukanye inyungu z'agathe ku mikorere y'ubuhinzi.",
      RECOMMENDATION: "Genzura indangagaciro z'WHAT/WHY/HOW/REC zombana mu makuru y'ubuhinzi n'agathe."
    }
  },
  rule4: {
    en: {
      WHAT: "Conservation Agriculture (CA) tillage costs are lower than Conventional Farming (CF) this season.",
      WHY: "CA practices can reduce soil disturbance and associated costs.",
      HOW: "By comparing tillage costs between CA and CF treatments.",
      RECOMMENDATION: "Consider adopting more CA practices to lower long-term costs."
    },
    rw: {
      WHAT: "Igiciro cyo gutegura ubutaka muri CA kiri munsi ya CF.",
      WHY: "Imikorere ya CA ishobora kugabanya ubutaka n'ibiciro bihuzwa.",
      HOW: "Kugereranya ibiciro byo gutegura ubutaka hagati ya CA na CF.",
      RECOMMENDATION: "Tekereza kwemera imikorere ya CA kugabanya ibiciro by'igihe kirekire."
    }
  },
  rule5: {
    en: {
      WHAT: "Soil condition improved from previous season to current season. Projected fertilizer efficiency gain: 5-10% next season.",
      WHY: "Improving SOM and biological activity indicate CA residue retention is building soil carbon and biological cycling capacity.",
      HOW: "Increasing SOM improves nitrogen mineralization, reducing the gap between fertilizer input and crop nutrient availability.",
      RECOMMENDATION: "Reduce fertilizer 5% next season as a trial. Monitor yield response before applying larger reductions. Record j2 and fauna score each season."
    },
    rw: {
      WHAT: "Imiterere y'ubutaka yateye imbere ugereranyije n'igihembwe gishize. Icyizere ni uko ifumbire ikoreshwa neza 5-10% mu cyumweru gitaha.",
      WHY: "Kongera SOM na activity y'ubuzima bishobora kugaragaza ko CA ibungabunga umwuka w'ubutaka n'ubuzima bw'ubutaka.",
      HOW: "Kongera SOM bituma nitrogen imenyekanisha neza, bigabanya icyuho hagati y'ifumbire n'ibiribwa by'igihingwa.",
      RECOMMENDATION: "Gabanya ifumbire 5% mu cyumweru gitaha nk'igerageza. Kurikirana umusaruro mbere yo kongera kugabanya. Andika amanota ya j2 na fauna buri gihembwe."
    }
  },
  rule6: {
    en: {
      WHAT: "Adoption cost is declining over multiple seasons, reflecting improving CA efficiency.",
      WHY: "CA cost structure is improving as farmers gain experience, soils improve, and system-specific efficiencies accumulate.",
      HOW: "Performance improves through better mulch-based weed suppression, rising soil biological activity, and reduced farmer inefficiencies.",
      RECOMMENDATION: "Continue monitoring and maintain residue retention consistently as the primary driver of improvement."
    },
    rw: {
      WHAT: "Igiciro cy'iyimenyerezwa kiri kugabanuka mu bihembwe byinshi, bikerekana kunoza CA.",
      WHY: "Imikorere ya CA iragenda izamuka uko abahinzi bunguka uburambe, ubutaka bwongera ubuziranenge, kandi ingufu z'imikorere zirushaho kuba nziza.",
      HOW: "Imikorere irushaho kuba myiza kubera kurwanya ibyatsi bikozwe na mulch, kwiyongera k'ubuzima bw'ubutaka, no kugabanya amakosa y'abahinzi.",
      RECOMMENDATION: "Komeza ukurikire kandi wubahirize gufata residue neza nk'umusingi w'iterambere."
    }
  },
  rule7: {
    en: {
      WHAT: "Adoption costs are increasing, and CA is losing competitive advantage.",
      WHY: "Rising costs may discourage continued adoption of CA practices.",
      HOW: "By analyzing cost trends and adoption rates.",
      RECOMMENDATION: "Review CA implementation to identify cost-saving opportunities."
    },
    rw: {
      WHAT: "Igiciro cy'iyimenyerezwa kiri kwiyongera, CA iri gusubira inyuma.",
      WHY: "Ibiciro biyongera bishobora guhagarika iyimenyerezwa ya CA.",
      HOW: "Kugenzura ibiciro n'iyimenyerezwa.",
      RECOMMENDATION: "Soma iyimenyerezwa ya CA kugirango ubone ibiciro bigabanuka."
    }
  },
  rule8: {
    en: {
      WHAT: "High pest incidence detected, which may reduce profits.",
      WHY: "Pests can damage crops and increase control costs.",
      HOW: "By monitoring pest levels in agronomic data.",
      RECOMMENDATION: "Implement integrated pest management strategies to mitigate losses."
    },
    rw: {
      WHAT: "Udukoko twinshi dushobora kugabanya inyungu.",
      WHY: "Udukoko dushobora gukomereza ibihingwa no kwiyongera ibiciro.",
      HOW: "Kugenzura udukoko mu makuru y'ubuhinzi.",
      RECOMMENDATION: "Koresha uburyo bwo kurwanya udukoko kugabanya ibihombo."
    }
  },
  rule9: {
    en: {
      WHAT: "Fertilizer costs increased without corresponding yield gains.",
      WHY: "Inefficient fertilizer use may not justify the expense.",
      HOW: "By comparing fertilizer spending and yield outcomes.",
      RECOMMENDATION: "Optimize fertilizer application rates and timing for better efficiency."
    },
    rw: {
      WHAT: "Igiciro cy'ifumbire cyazamutse ariko umusaruro ntiyiyongereye.",
      WHY: "Kutakoresha ifumbire neza ntibishobora kwemerera igiciro.",
      HOW: "Kugereranya igiciro cy'ifumbire n'umusaruro.",
      RECOMMENDATION: "Noza igipimo cy'ifumbire n'igihe kugirango ubone ubushobozi bwiza."
    }
  },
  rule10: {
    en: {
      WHAT: "Irrigation costs rose without soil condition improvements.",
      WHY: "Water use may not be effectively enhancing soil health.",
      HOW: "By evaluating irrigation expenses and soil metrics.",
      RECOMMENDATION: "Assess irrigation efficiency and consider alternative water management."
    },
    rw: {
      WHAT: "Igiciro cyo kuhira cyiyongereye ubutaka butahindutse.",
      WHY: "Kutakoresha amazi neza ntibishobora gutuma ubutaka bwiza.",
      HOW: "Kugenzura ibiciro by'amazi n'ubutaka.",
      RECOMMENDATION: "Genzura ubushobozi bw'amazi kandi witegereze ubundi buryo bwo kubungabunga amazi."
    }
  },
  rule11: {
    en: {
      WHAT: "Yield increased but profit decreased due to higher costs.",
      WHY: "Cost overruns can negate productivity gains.",
      HOW: "By analyzing yield and cost data together.",
      RECOMMENDATION: "Focus on cost control while maintaining yield improvements."
    },
    rw: {
      WHAT: "Umusaruro wazamutse ariko inyungu igabanuka kubera ibiciro birenze.",
      WHY: "Ibiciro birenze bishobora guhagarika inyungu.",
      HOW: "Kugenzura umusaruro n'ibiciro hamwe.",
      RECOMMENDATION: "Tekereza ku biciro mu gihe ukomereza umusaruro."
    }
  },
  rule13: {
    en: {
      WHAT: "CA labor demand rose during STABILIZATION phase, even though labor should be declining.",
      WHY: "This may indicate residue burden or weed rebound increasing labor requirements.",
      HOW: "Higher workload from weeding and residue management can offset efficiency gains in later phases.",
      RECOMMENDATION: "Review WD and RM operations to reduce unnecessary labor and stabilize effort."
    },
    rw: {
      WHAT: "Umurimo wa CA wazamutse mu cyiciro cya STABILIZATION, nubwo wakagombye kugabanuka.",
      WHY: "Ibi bishobora kugaragaza ko residue cyangwa ibyatsi byongereye umurimo.",
      HOW: "Umurimo ukomeye wo kurwanya ibyatsi no gucunga residue ushobora kugabanya inyungu z'ubuhanga mu bihe byashize.",
      RECOMMENDATION: "Soma ibikorwa bya WD na RM kugirango ugabanye umurimo utari ngombwa kandi utezimbere imbaraga."
    }
  },
  rule12: {
    en: {
      WHAT: "Time to Profitability (TTP) milestone achieved with zero adoption costs.",
      WHY: "This indicates successful transition to sustainable practices.",
      HOW: "By confirming sustained profitability without ongoing costs.",
      RECOMMENDATION: "Celebrate the achievement and monitor for continued success."
    },
    rw: {
      WHAT: "Igihe cyo kunguka cyagezweho hamwe n'igiciro cy'iyimenyerezwa cya zeru.",
      WHY: "Ibi bigaragaza iyimenyerezwa ryiza ku mikorere ihoraho.",
      HOW: "Kubona inyungu ihoraho nta biciro bihoraho.",
      RECOMMENDATION: "Shiriza ibyagezweho kandi ugenzure ibyagezweho."
    }
  },
};
