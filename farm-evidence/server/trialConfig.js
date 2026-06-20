// Node.js backend model for trial configuration
export class TrialConfig {
  constructor({
    trialName = '',
    treatments = ['CA', 'CF'],
    replications = 3,
    plotSizeM2 = 25,
    plotDimensions = '5m x 5m',
    bufferZones = '',
    extrapolationFactor = 400,
    crop = '',
    variety = '',
    plantingDate = '',
    previousCrop = '',
    season = '',
    interRowSpacing = 75,
    intraRowSpacing = 30,
    seedsPerHill = 1,
    marketPrice = 0,
    wageRate = 0,
    workingHoursPerDay = 8,
    seedRate = 0,
    seedPrice = 0,
    treatmentDescriptions = {},
    sharedInputs = '',
  } = {}) {
    this.trialName = trialName;
    this.treatments = treatments;
    this.replications = replications;
    this.plotSizeM2 = plotSizeM2;
    this.plotDimensions = plotDimensions;
    this.bufferZones = bufferZones;
    this.extrapolationFactor = extrapolationFactor;
    this.crop = crop;
    this.variety = variety;
    this.plantingDate = plantingDate;
    this.previousCrop = previousCrop;
    this.season = season;
    this.interRowSpacing = interRowSpacing;
    this.intraRowSpacing = intraRowSpacing;
    this.seedsPerHill = seedsPerHill;
    this.marketPrice = marketPrice;
    this.wageRate = wageRate;
    this.workingHoursPerDay = workingHoursPerDay;
    this.seedRate = seedRate;
    this.seedPrice = seedPrice;
    this.treatmentDescriptions = treatmentDescriptions;
    this.sharedInputs = sharedInputs;
  }
}
