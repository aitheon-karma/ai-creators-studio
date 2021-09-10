import {Injectable} from '@angular/core';
import { Project, AutomationRestService } from '@aitheon/creators-studio';
import { ToastrService } from 'ngx-toastr';
import { ReplaySubject } from 'rxjs';

const LOCAL_STORAGE_KEY = 'sandboxes-automations';
const INTERVAL_TIME = 4000;
@Injectable({providedIn: 'root'})
export class AutomationTrackerService {

  trackingAutomations = [];
  interval: any;
  sandboxId: string;
  projects: any;
  private buildStatus = new ReplaySubject<any>();



  constructor(private automationService: AutomationRestService,
     private toastr: ToastrService) {}


  startChecker(sandboxId: string) {
    this.sandboxId = sandboxId;
    if (!this.interval) {
      this.interval = setInterval(this.checker.bind(this), INTERVAL_TIME);
    }
    const value = this.getFromLocalStorage();
    try {
      this.buildStatus.next(Object.keys(value[sandboxId]).map(key => value[sandboxId][key]).reverse());
    } catch (err) {

    }

  }

  get buildStatus$() {
    return this.buildStatus.asObservable();
  }

  private checker() {
    const storage = this.getFromLocalStorage();
    const projects = storage[this.sandboxId];
    let inProgressCount = 0;
    for (const projectSlug in projects) {
      if (projects[projectSlug].inProgress) {
        inProgressCount += 1;
        const automationId = projects[projectSlug].automationId;
        this.automationService.status(automationId).subscribe(status => {
          if (status.completed) {
            this.toastr.success(`${projects[projectSlug].projectName} build success`);
          }
          if (status.error) {
            this.toastr.error(`${projects[projectSlug].projectName} build failed`);
          }
          this.set(this.sandboxId, projectSlug, status);
        });
      }
    }
  }

  addToTracker(sandboxId: string, project: Project, status: any) {
    if (this.sandboxId && (this.sandboxId !== sandboxId)) {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    }
    status.projectName = project.name;
    status.inProgress = true;
    this.set(sandboxId, project.slug, status);
    this.startChecker(sandboxId);
    this.toastr.success(`${project.name} build successfully started`);
  }

  stopChecker() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }


  getFromLocalStorage(): {} {
    try {
      const value = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
      return (typeof value === 'object' && value !== null) ? value : {};
    } catch (err) {
      return {};
    }
  }

  set(sandboxId: string, projectSlug: string, status: any): {} {
    try {
      const value = this.getFromLocalStorage();
      if (!value[sandboxId]) {
        value[sandboxId] = {[projectSlug]: status};
      } else {
        value[sandboxId][projectSlug] = {...value[sandboxId][projectSlug], ...status};
      }
      this.buildStatus.next(Object.keys(value[sandboxId]).map(key => value[sandboxId][key]).reverse());
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
    } catch (err) {
      return {};
    }
  }


  delete(sandboxId: string, projectSlug: string): {} {
    try {
      const value = this.getFromLocalStorage();
      value[sandboxId] = {...value[sandboxId], status};
      if (value[sandboxId] && value[sandboxId][projectSlug]) {
          delete value[sandboxId][projectSlug];
      }

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
    } catch (err) {
      return {};
    }
  }



}
