import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreClientModule } from '@aitheon/core-client';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { SettingsRoutingModule } from './settings-routing.module';
import { SharedModule } from '../shared/shared.module';
import { ServiceSettingsComponent } from './service-settings/service-settings.component';
import { DeviceSettingsComponent } from './device-settings/device-settings.component';
import { MechbotSettingsComponent } from './mechbot-settings/mechbot-settings.component';
import { AppSettingsComponent } from './app-settings/app-settings.component';
import { MechbotNodeSettingsComponent } from './mechbot-node-settings/mechbot-node-settings.component';
import { DigibotSettingsComponent } from './digibot-settings/digibot-settings.component';
import {AutosizeModule} from 'ngx-autosize';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { ProjectTypeSettingsComponent } from './project-type-settings/project-type-settings.component';
import { DependenciesSettingsComponent } from './dependencies-settings/dependencies-settings.component';
import { NodeStructureComponent } from './node-structure/node-structure.component';
import { ColorPickerModule } from 'ngx-color-picker';

@NgModule({
  declarations: [
    ServiceSettingsComponent,
    DeviceSettingsComponent,
    MechbotSettingsComponent,
    AppSettingsComponent,
    MechbotNodeSettingsComponent,
    DigibotSettingsComponent,
    ProjectTypeSettingsComponent,
    DependenciesSettingsComponent,
    NodeStructureComponent
  ],
  imports: [
    CommonModule,
    NgOptionHighlightModule,
    SettingsRoutingModule,
    CoreClientModule,
    TabsModule,
    SharedModule,
    AutosizeModule,
    ButtonsModule.forRoot(),
    ColorPickerModule
  ],
  exports: [
    ProjectTypeSettingsComponent,
  ]
})
export class SettingsModule { }
