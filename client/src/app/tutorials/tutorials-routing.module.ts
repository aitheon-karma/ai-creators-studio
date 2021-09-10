import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TutorialsDashboardComponent } from './tutorials-dashboard/tutorials-dashboard.component';

const routes: Routes = [
  {path: '', component: TutorialsDashboardComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TutorialsRoutingModule { }
