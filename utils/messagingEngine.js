const MESSAGES = {
  en: {
    csi_high: "Under your current conditions, CA is expected to perform favourably from the first season. Keep recording data to confirm the trajectory.",
    csi_moderate: "Early results may vary depending on your conditions. CA benefits typically emerge by Season 3–4. Your system is on track.",
    csi_low: "Your current site conditions present challenges for early CA performance. This does not mean CA will not work — it means targeted support on residue management and weed control is recommended now.",
    phase_stabilization: "Your CA system is entering the stabilization phase. Cost advantages are expected to strengthen each season. Compare your actual performance with the projection chart.",
    phase_mature: "Your CA system has reached maturity. Evidence from long-term trials shows operating costs 9.8% lower and profits 13% higher than conventional farming at this stage.",
    delta_positive: "CA is currently more cost-efficient than conventional farming on this plot. Your system is performing above the comparison baseline.",
    delta_negative: "CA costs are currently higher than CF on this plot. This is documented in early transition research. Your system is projected to reach cost parity by Season {ttp}. View the trajectory chart."
  },
  kin: {
    csi_high: "Mu bihe bya none, ubuhinzi bw'uburinzi buteganijwe gukorana neza uhereye mu gihembwe cya mbere. Komeza uandike amakuru kugira ngo uremeze inzira.",
    csi_moderate: "Ibisubizo bya mbere bishobora gutandukana bitewe n'ibibazo byawe. Inyungu z'uburinzi zikunze kugaragara mu gihembwe cya 3-4. Sisitemu yawe iri mu nzira.",
    csi_low: "Ibibazo bya none by'ahantu byerekana ingorane ku mikorere ya CA mu bihe bya mbere. Ibi ntibisobanura ko CA ntizakorana neza — bisobanura ko ubufasha bugenewe uburinzi bw'imyotsi n'igenzura rya remba bugombwa ubu.",
    phase_stabilization: "Sisitemu yawe ya CA iri gukira mu ntera yo gutuza. Inyungu z'ibitaro ziteganijwe gukomera buri gihembwe. Geranya imikorere yawe nyirizina n'ishusho y'inzira.",
    phase_mature: "Sisitemu yawe ya CA yagezeho igihe cyayo. Ibimenyetso by'igerageza rirambye bigaragaza ko ibitaro by'imirimo ari 9.8% munsi no inyungu 13% isumba ubuhinzi bwa kijyambere muri iki gihe.",
    delta_positive: "CA ubu ni ingirakamaro kuruta ubuhinzi bwa kijyambere kuri iyi mirima. Sisitemu yawe ikora hejuru y'ikigereranyo cy'igereranya.",
    delta_negative: "Ibitaro bya CA ubu ni byinshi kuruta CF kuri iyi mirima. Ibi byanditswe mu bushakashatsi bwa mbere bw'intera. Sisitemu yawe iteganijwe kugera ku buringanire bw'ibitaro mu gihembwe cya {ttp}."
  }
};

/**
 * Get farmer message for current phase + CSI.
 * @param {string} messageKey  - from fullCBAEngine
 * @param {string} lang        - 'en' or 'kin'
 * @param {object} vars        - { ttp } for string interpolation
 * @returns {string}
 */
function getFarmerMessage(messageKey, lang = 'en', vars = {}) {
  const bank = MESSAGES[lang] || MESSAGES.en;
  let msg = bank[messageKey] || bank.csi_moderate;
  for (const [key, val] of Object.entries(vars)) {
    msg = msg.replace(`{${key}}`, val);
  }
  return msg;
}

module.exports = { MESSAGES, getFarmerMessage };