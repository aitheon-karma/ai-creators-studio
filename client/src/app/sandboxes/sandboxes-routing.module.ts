import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SandboxesDashboardComponent } from './sandboxes-dashboard/sandboxes-dashboard.component';
import { SandboxesDetailComponent } from './sandboxes-detail/sandboxes-detail.component';

const routes: Routes = [
  {
    path: 'sandboxes',
    component: SandboxesDashboardComponent
  },
  {
    path: 'sandboxes/:sandboxId',
    component: SandboxesDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SandboxesRoutingModule { }
