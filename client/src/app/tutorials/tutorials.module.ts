import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutorialsRoutingModule } from './tutorials-routing.module';
import { TutorialsListComponent } from './tutorials-list/tutorials-list.component';
import { TutorialsDashboardComponent } from './tutorials-dashboard/tutorials-dashboard.component';

@NgModule({
  declarations: [
    TutorialsListComponent,
    TutorialsDashboardComponent
  ],
  imports: [
    TutorialsRoutingModule,
    CommonModule
  ]
})
export class TutorialsModule { }
