import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { AutomationRestService, Project } from '@aitheon/creators-studio';
import { environment } from 'src/environments/environment';
import { AutomationTrackerService } from '../shared/automation-tracker.service';

@Component({
  selector: 'ai-automation-quick-release',
  templateUrl: './automation-quick-release.component.html',
  styleUrls: ['./automation-quick-release.component.scss']
})
export class AutomationQuickReleaseComponent implements OnInit {

  @ViewChild('quickReleaseTemplate') quickReleaseTemplate: TemplateRef<any>;
  quickReleaseModalRef: BsModalRef;
  loading = false;
  projectList: Project[] = [];
  sandboxId: string;
  errorMessage: string;
  selectedProject: Project;
  automationId: string;

  constructor(private modalService: BsModalService,
      private automationTrackerService: AutomationTrackerService,
     private automationService: AutomationRestService) { }


  ngOnInit() {

  }



  show(sandboxId: string, automationId?: string) {
    this.quickReleaseModalRef = this.modalService.show(this.quickReleaseTemplate, { class: 'modal-md' });
    this.selectedProject = null;
    if (sandboxId) {
      this.sandboxId = sandboxId;
      this.automationId = automationId;
      this.initProjects();
    }
  }

  release() {
    if (!this.selectedProject) {
      return;
    }
    this.automationService.quickRelease(this.sandboxId, { automationId: this.automationId, projectId: this.selectedProject._id })
      .subscribe(results => {
        this.automationTrackerService.addToTracker(this.sandboxId, this.selectedProject, results);
        this.closeModal();
      });
  }


  initProjects() {
    this.loading = true;
    this.errorMessage = null;
    this.automationService.getActiveProjects(this.sandboxId).subscribe((projects: Project[]) => {
      this.projectList = projects;
      this.loading = false;
    },
      (err) => {
        this.errorMessage = err.error.error || err.error.message;
        this.loading = false;
      });
  }

  selectProject(project: Project) {
    this.selectedProject = project;
  }


  closeModal() {
    this.quickReleaseModalRef.hide();
  }


}
