/* PAGE CONTENT - DATA */
/* Content of the Diagnose, Guides and Maintenance pages. Each card only stores translation keys
   (the texts are in src/i18n/translations.json), and the pages draw them with the InfoCard component. */

//Diagnose: title, possible cause and what to try.
export const DIAGNOSE_CARDS = [
    { titleKey: "heroDiagnoseNoPower", textKeys: ["heroDiagnoseNoPowerDesc", "heroDiagnoseNoPowerText"] },
    { titleKey: "heroDiagnoseSlowPerformance", textKeys: ["heroDiagnoseSlowPerformanceDesc", "heroDiagnoseSlowPerformanceText"] },
    { titleKey: "BlueScreenTitle", textKeys: ["BlueScreenCause", "BlueScreenTry"] },
    { titleKey: "InternetProblemTitle", textKeys: ["InternetProblemCause", "InternetProblemTry"] },
    { titleKey: "DiagnoseNoDisplayTitle", textKeys: ["DiagnoseNoDisplayDesc", "DiagnoseNoDisplayTry"] },
    { titleKey: "DiagnoseRandomRestartTitle", textKeys: ["DiagnoseRandomRestartDesc", "DiagnoseRandomRestartTry"] },
    { titleKey: "DiagnoseOverheatingTitle", textKeys: ["DiagnoseOverheatingDesc", "DiagnoseOverheatingTry"] },
    { titleKey: "DiagnoseNoAudioTitle", textKeys: ["DiagnoseNoAudioDesc", "DiagnoseNoAudioTry"] },
    { titleKey: "DiagnoseNoBootTitle", textKeys: ["DiagnoseNoBootDesc", "DiagnoseNoBootTry"] },
    { titleKey: "DiagnoseBeepCodesTitle", textKeys: ["DiagnoseBeepCodesDesc", "DiagnoseBeepCodesTry"] },
    { titleKey: "DiagnoseUsbProblemTitle", textKeys: ["DiagnoseUsbProblemDesc", "DiagnoseUsbProblemTry"] },
    { titleKey: "DiagnoseFreezingTitle", textKeys: ["DiagnoseFreezingDesc", "DiagnoseFreezingTry"] },
];

//Guides: Windows blue screen (BSOD) codes, with three steps each.
export const GUIDE_CARDS = [
    { titleKey: "BSOD1Title", badgeKey: "BSOD1Badge", textKeys: ["BSOD1Desc"], stepKeys: ["BSOD1Step1", "BSOD1Step2", "BSOD1Step3"] },
    { titleKey: "BSOD2Title", badgeKey: "BSOD2Badge", textKeys: ["BSOD2Desc"], stepKeys: ["BSOD2Step1", "BSOD2Step2", "BSOD2Step3"] },
    { titleKey: "BSOD3Title", badgeKey: "BSOD3Badge", textKeys: ["BSOD3Desc"], stepKeys: ["BSOD3Step1", "BSOD3Step2", "BSOD3Step3"] },
    { titleKey: "BSOD4Title", badgeKey: "BSOD4Badge", textKeys: ["BSOD4Desc"], stepKeys: ["BSOD4Step1", "BSOD4Step2", "BSOD4Step3"] },
    { titleKey: "BSOD5Title", badgeKey: "BSOD5Badge", textKeys: ["BSOD5Desc"], stepKeys: ["BSOD5Step1", "BSOD5Step2", "BSOD5Step3"] },
    { titleKey: "BSOD6Title", badgeKey: "BSOD6Badge", textKeys: ["BSOD6Desc"], stepKeys: ["BSOD6Step1", "BSOD6Step2", "BSOD6Step3"] },
    { titleKey: "BSOD7Title", badgeKey: "BSOD7Badge", textKeys: ["BSOD7Desc"], stepKeys: ["BSOD7Step1", "BSOD7Step2", "BSOD7Step3"] },
    { titleKey: "BSOD8Title", badgeKey: "BSOD8Badge", textKeys: ["BSOD8Desc"], stepKeys: ["BSOD8Step1", "BSOD8Step2", "BSOD8Step3"] },
    { titleKey: "BSOD9Title", badgeKey: "BSOD9Badge", textKeys: ["BSOD9Desc"], stepKeys: ["BSOD9Step1", "BSOD9Step2", "BSOD9Step3"] },
    { titleKey: "BSOD10Title", badgeKey: "BSOD10Badge", textKeys: ["BSOD10Desc"], stepKeys: ["BSOD10Step1", "BSOD10Step2", "BSOD10Step3"] },
    { titleKey: "BSOD11Title", badgeKey: "BSOD11Badge", textKeys: ["BSOD11Desc"], stepKeys: ["BSOD11Step1", "BSOD11Step2", "BSOD11Step3"] },
    { titleKey: "BSOD12Title", badgeKey: "BSOD12Badge", textKeys: ["BSOD12Desc"], stepKeys: ["BSOD12Step1", "BSOD12Step2", "BSOD12Step3"] },
    { titleKey: "BSOD13Title", badgeKey: "BSOD13Badge", textKeys: ["BSOD13Desc"], stepKeys: ["BSOD13Step1", "BSOD13Step2", "BSOD13Step3"] },
    { titleKey: "BSOD14Title", badgeKey: "BSOD14Badge", textKeys: ["BSOD14Desc"], stepKeys: ["BSOD14Step1", "BSOD14Step2", "BSOD14Step3"] },
    { titleKey: "BSOD15Title", badgeKey: "BSOD15Badge", textKeys: ["BSOD15Desc"], stepKeys: ["BSOD15Step1", "BSOD15Step2", "BSOD15Step3"] },
];

//Maintenance: preventive habits.
export const MAINTENANCE_CARDS = [
    { titleKey: "HardwareHero", textKeys: ["HardwareHeroDesc"] },
    { titleKey: "SoftwareHero", textKeys: ["SoftwareHeroDesc"] },
    { titleKey: "AntiVirusHero", textKeys: ["AntiVirusHeroDesc"] },
    { titleKey: "BackupHero", textKeys: ["BackupHeroDesc"] },
    { titleKey: "StartupHero", textKeys: ["StartupHeroDesc"] },
    { titleKey: "DiskSpaceHero", textKeys: ["DiskSpaceHeroDesc"] },
    { titleKey: "AirflowHero", textKeys: ["AirflowHeroDesc"] },
    { titleKey: "RestartHero", textKeys: ["RestartHeroDesc"] },
    { titleKey: "DriveHealthHero", textKeys: ["DriveHealthHeroDesc"] },
    { titleKey: "SurgeProtectionHero", textKeys: ["SurgeProtectionHeroDesc"] },
    { titleKey: "PeripheralsHero", textKeys: ["PeripheralsHeroDesc"] },
    { titleKey: "CableCareHero", textKeys: ["CableCareHeroDesc"] },
    { titleKey: "UninstallUnusedHero", textKeys: ["UninstallUnusedHeroDesc"] },
    { titleKey: "BatteryCareHero", textKeys: ["BatteryCareHeroDesc"] },
    { titleKey: "ThermalPasteHero", textKeys: ["ThermalPasteHeroDesc"] },
    { titleKey: "SafeEnvironmentHero", textKeys: ["SafeEnvironmentHeroDesc"] },
];
