// export class Project {
//   name: string;
//   projectType: ProjectType;
//   appStoreSettings: AppStoreSettings;
//   settings: Settings;

// }

export  class Settings {

    // robot and app
    hideUserHeader?: boolean;
    userLoginRequired?: boolean;
    loginScreenType?: LoginScreenType;

    // device
    deviceType?: DeviceType;
    deviceInfo?: SpecInformation;

    // robot
    robotType?: RobotType;
    enableAppFrontEnd?: boolean;

}


export class AppStoreSettings {

    enableSale: boolean;
    privateApp: boolean;
    name: string;
    slugName: string;
    description: string;
    screenShots?: string[];
    pricingType: PricingType;
    price: number;
    marketCategoryId?: any;
    images?: any;
    files?: any;
}

class SpecInformation {
    processor: string;
    io: string;
    ram: string;
}


export enum PricingType {
    MONTHLY = 'MONTHLY',
    ONE_TIME = 'ONE_TIME'
}


export enum DeviceType {
    ALPHA_IO_EXTREME = 'ALPHA_IO_EXTREME',
    ALPHA_IO_PLUS = 'ALPHA_IO_PLUS',
    APLPHA_IO = 'APLPHA_IO',
    ALPHA_IO_MINI = 'ALPHA_IO_MINI',
    APLHA_IO_MICRO = 'APLHA_IO_MICRO',
    AITHEON_DISPLAY = 'AITHEON_DISPLAY',
}

export enum RobotType {
    ISAAC_TX2 = 'ISAAC_TX2'
}

export enum LoginScreenType {
    SCREEN_TYPE_1 = 'SCREEN_TYPE_1',
    SCREEN_TYPE_2 = 'SCREEN_TYPE_2'
}

