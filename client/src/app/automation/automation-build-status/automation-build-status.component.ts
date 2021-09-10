import { Component, OnInit, ViewChild, TemplateRef, OnDestroy } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Subscription } from 'rxjs';
import { AutomationTrackerService } from '../shared/automation-tracker.service';
@Component({
  selector: 'ai-automation-build-status',
  templateUrl: './automation-build-status.component.html',
  styleUrls: ['./automation-build-status.component.scss']
})
export class AutomationBuildStatusComponent implements OnInit, OnDestroy {

  @ViewChild('buildStatusTemplate') quickReleaseTemplate: TemplateRef<any>;
  buildStatusRef: BsModalRef;
  subscription: Subscription;
  statuses: any[] = [];
  constructor(private automationTracker: AutomationTrackerService, private modalService: BsModalService) { }

  ngOnInit() {
    this.subscription = this.automationTracker.buildStatus$.subscribe(result => {
      this.statuses = result;
    });
  }

  show() {
    this.buildStatusRef = this.modalService.show(this.quickReleaseTemplate);
  }

  closeModal() {
    this.buildStatusRef.hide();
  }


  ngOnDestroy() {
    try {
      this.subscription.unsubscribe();
    } catch (err) {}
  }


  getCurrentTask(status: any) {
    let taskInfo: {name: string, cssClass: string};

    if (status.inProgress) {
     taskInfo = {name: 'In Progress', cssClass: 'build-status__item--status-orange'};
    }
    if (status.completed) {
      taskInfo = { name : 'Completed', cssClass: 'build-status__item--status-green'};
    }
    if (status.error) {
      taskInfo = {name: 'Error', cssClass: 'build-status__item--status-red'};
    }
    return taskInfo;
  }
}