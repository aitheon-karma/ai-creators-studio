import { ReleasesListComponent } from './../../releases/releases-list/releases-list.component';
import { Component, OnInit, HostListener, ViewChild, TemplateRef, OnDestroy, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  SandboxesRestService,
  Sandbox,
  Project,
  ProjectsRestService,
  MarketplaceSettings,
  AutomationRestService
} from '@aitheon/creators-studio';
import { environment } from '../../../environments/environment';
import { ApplicationBuildService, AuthService, ModalService } from '@aitheon/core-client';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ContextMenuComponent } from 'ngx-contextmenu';
import { debounceTime, distinctUntilChanged, delay } from 'rxjs/operators';
import { GenericConfirmComponent } from '../../shared/generic-confirm/generic-confirm.component';
import { SocketsRestService, Socket } from '@aitheon/system-graph';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../shared/shared.service';
import { AutomationQuickReleaseComponent } from '../../automation/automation-quick-release/automation-quick-release.component';
import { AutomationBuildStatusComponent } from '../../automation/automation-build-status/automation-build-status.component';
import { AutomationTrackerService } from 'src/app/automation/shared/automation-tracker.service';
import { SandboxComponentInstallerComponent } from '../sandbox-component-installer/sandbox-component-installer.component';

@Component({
  selector: 'ai-sandboxes-detail',
  templateUrl: './sandboxes-detail.component.html',
  styleUrls: ['./sandboxes-detail.component.scss']
})
export class SandboxesDetailComponent implements OnInit, OnDestroy {


  @ViewChild('genericConfirm') genericConfirm: GenericConfirmComponent;
  @ViewChild('releasesList') releasesList: ReleasesListComponent;
  @ViewChild('openProjectModal') openProjectModal: TemplateRef<any>;
  @ViewChild('newProjectModal') projectsModal: TemplateRef<any>;
  @ViewChild('ioModal') ioModal: TemplateRef<any>;
  @ViewChild('sandboxContextMenu') sandboxContextMenu: ContextMenuComponent;
  @ViewChild('projectSettingsModal') projectSettingsModal: TemplateRef<any>;
  @ViewChild('quickRelease') quickReleaseComponent: AutomationQuickReleaseComponent;
  @ViewChild('buildStatus') buildStatusComponent: AutomationBuildStatusComponent;
  @ViewChild('componentInstaller') componentInstallerComponent: SandboxComponentInstallerComponent;

  searchName: BehaviorSubject<string> = new BehaviorSubject<string>('');
  openProjectModalRef: BsModalRef;
  projectsModalRef: BsModalRef;
  ioModalRef: BsModalRef;
  projectSettingsModalRef: BsModalRef;
  sandboxId: string;
  sandbox: Sandbox;
  url: string;
  loading = false;
  isAddProjectSelectOpen = false;
  vsCodeRunning = false;
  projects: Project[];
  projectsAfterSearch: Project[];
  activeProject: any;
  searchNameValue: string;
  pingInterval: any;
  inactivityWarningInterval: any;
  inactivityTimeout: any;


  projectToSelect = false;
  projectIoModal: Project;
  socketGroups = [];
  selectedSocketGroups = [];
  selectedSockets = [];
  groups = [];
  socketToView: any;
  ioLoading = false;
  MarketplaceSettings = {};
  listOfGroups$: Subscription = new Subscription();
  marketplaceSettings: MarketplaceSettings = new MarketplaceSettings;
  submitted = false;
  automationId: string;
  name: string;
  workspaces: any;
  getWorkspace: any;
  selectedProjectId: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private sandboxesRestService: SandboxesRestService,
    private projectsRestService: ProjectsRestService,
    private BSmodalService: BsModalService,
    private toastr: ToastrService,
    private socketsRestService: SocketsRestService,
    private sharedService: SharedService,
    private automationTrackerService: AutomationTrackerService,
    private applicationBuildService: ApplicationBuildService,
    private modalService: ModalService
  ) { }

  @HostListener('window:message', ['$event'])
  onMessage(event) {
    try {
      const data = event.data;
      if (data.event === 'loaded') {
        this.loading = false;
        this.applicationBuildService.setBuildStatus$(null);
        this.vsCodeRunning = true;
      }
    } catch (error) {
    }
  }

  ngOnInit() {
    if (environment.production) {
      this.loading = true;

      this.applicationBuildService.setBuildStatus$({
        current: 'Booting up sandbox...',
        steps: ['Booting up sandbox...'],
        approximateTime: '40 seconds',
      });
    } else {
      this.applicationBuildService.setBuildStatus$({
        current: 'Booting up sandbox...',
        steps: ['Booting up sandbox...'],
        approximateTime: '40 seconds',
      });
    }
    this.setVsCodeUrl(false);
    this.loadSandbox();
    // this.getVsCodeStatus();

    this.activatedRoute.queryParamMap.subscribe(query => {
      this.selectedProjectId = query.get('projectId');
    });

    this.searchName.pipe(
      debounceTime(200),
      distinctUntilChanged())
      .subscribe(model => {
        if (!model) {
          this.projectsAfterSearch = this.projects;
        }
        this.searchNameValue = model;
        if (this.projects) {
          this.projectsAfterSearch = this.projects.filter((project: Project) => {
            return project.name.toLowerCase().includes(this.searchNameValue.toLowerCase());
          });
        }
      });
    this.initPing();
    this.listenToRequestModalClose();
    this.processAutomationId();
    this.automationTrackerService.startChecker(this.sandboxId);
  }

  loadGroups() {
    this.listOfGroups$ = this.socketsRestService.listGroups().subscribe(groups => {
      this.modifyGroups(groups);
      this.loadSockets(groups);
    }, err => console.log('! HTTP Error', err));
  }

  processAutomationId() {
    const { automationId } = this.activatedRoute.snapshot.queryParams;
    const key = `sandbox-automation`;
    const automations = this.getLocalStorageSandboxAutomations();
    if (automationId) {
      this.automationId = automationId;
      automations[this.sandboxId] = automationId;
    } else {
      const value = automations[this.sandboxId];
      if (value) {
          this.automationId  = value;
      }
    }
    if (this.automationId) {
      localStorage.setItem(key, JSON.stringify(automations));
    }
  }

  getLocalStorageSandboxAutomations(): {} {
    try {
      const value = JSON.parse(localStorage.getItem(`sandbox-automation`));
      return (typeof value === 'object' && value !== null) ? value : {};
    } catch (err) {
      return {};
    }
  }

  modifyGroups(groups) {
    this.selectedSocketGroups = [];
    return groups.map(group => {
      group['sockets'] = [];
      group['showSocketsListShow'] = false;
      group['added'] = false;
    });
  }

  quickDeploy() {
    // this.automationRestService.quickRelease(this.sandboxId, { automationId: this.automationId }).subscribe(() => {
    //   window.close();
    // });
    this.quickReleaseComponent.show(this.sandboxId, this.automationId);
  }

  loadSockets(groups) {
    groups.map(group => {
      this.socketsRestService.listByGroup(group._id).subscribe(sockets => {
        group.sockets.push(sockets);
      });
    });
    if (this.projectIoModal.socketGroups.length > 0) {
      groups.map(group => {
        this.projectIoModal.socketGroups.map(socketGroupId => {
          if (socketGroupId === group._id) {
            group.added = true;
            this.selectedSocketGroups.push(group._id);
          }
        });
      });
    }
    this.groups = groups;
  }

  loadProjects() {
    this.projectsRestService.list().subscribe((projects: Project[]) => {
      this.projects = projects;
      this.projectsAfterSearch = this.projects;
      if (this.selectedProjectId) {
        this.loadProject(this.selectedProjectId);
      }
    });
  }

  loadSandbox() {
    this.sandboxesRestService.getById(this.sandboxId).subscribe(async (sandbox: Sandbox) => {
      this.sandbox = sandbox;
      const base = environment.production ? window.location.hostname : environment.baseApi.replace('https://', '');
      // tslint:disable-next-line:max-line-length
      const vsCodeApiUrl = `https://ws.${this.sanatizeOrgDomain(base)}/sandboxes/${this.sandboxId}/vscode-remote-resource?path=%2Fusr%2Flib%2Fcode-server%2Flib%2Fvscode%2Fextensions%2Fini%2Fsyntaxes%2Fini.tmLanguage.json&tkn=`;
      let vsCodeApiStatus = false;
      try {
        const vsCodeApiResponse = await fetch(vsCodeApiUrl, { mode: 'cors' });
        vsCodeApiStatus = vsCodeApiResponse.status !== 502;
        this.loadProjects();
      } catch (err) {
      }

      // vs code still not loaded, keep get api status and refresh on load
      if (!vsCodeApiStatus) {
        setTimeout(() => {
          this.loadSandbox();
        }, 5 * 1000);
      } else {
        // we stil not get event from postmessage, so refresh page
        if (!this.vsCodeRunning) {
          this.setVsCodeUrl(true);
        }
      }

      // if (this.sandbox && this.sandbox.status === Sandbox.StatusEnum.PENDING && sandbox.status === Sandbox.StatusEnum.RUNNING) {
      //   this.setVsCodeUrl(true);
      // }
      // if (!this.vsCodeRunning && (this.sandbox.status === Sandbox.StatusEnum.PENDING ||
      //   this.sandbox.status === Sandbox.StatusEnum.RUNNING)) {
      //   setTimeout(() => {
      //     this.loadSandbox();
      //   }, environment.pingSandboxTime / 2);
      // }
      if (this.sandbox.status === Sandbox.StatusEnum.TERMINATED || this.sandbox.status === Sandbox.StatusEnum.SHUTTING_DOWN) {
        this.clearPingInterval();
        this.showTerminated();
      }
    });
  }

  addProjectOpenSelect(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.isAddProjectSelectOpen = !this.isAddProjectSelectOpen;
  }

  showNewProject() {
    this.projectsModalRef = this.BSmodalService.show(this.projectsModal,
      Object.assign({}, { class: 'modal-xxl' })
    );
  }

  showLoadProject() {
    this.openProjectModalRef = this.BSmodalService.show(this.openProjectModal,
      Object.assign({}, { class: 'modal-open-project' })
    );
  }

  setVsCodeUrl(refresh: boolean) {
    this.sandboxId = this.activatedRoute.snapshot.params['sandboxId'];
    const refreshQuery = refresh ? `r=${new Date().getTime()}&`  : '';
    // tslint:disable-next-line:max-line-length
    const base = environment.production ? window.location.hostname : environment.baseApi.replace('https://', '');
    const workspace = `/home/coder/workspace/workspace.code-workspace`;
    const workspaceUri = `workspace=${workspace}`;

    if (!environment.production) {
      this.authService.token.subscribe((token: string) => {
        this.authService.activeOrganization.subscribe((activeOrganization: any) => {
          let org = '';
          if (activeOrganization) {
            org = `&organization-domain=${activeOrganization.domain}`;
          }
          this.url = `https://ws.${base}/sandboxes/${this.sandboxId}/?fl_token=${token}${org}&${refreshQuery}${workspaceUri}`;
        });
      });
    } else {
      this.url = `https://ws.${this.sanatizeOrgDomain(base)}/sandboxes/${this.sandboxId}/?${refreshQuery}${workspaceUri}`;
    }
  }

  sanatizeOrgDomain(domain: string) {
    const splittedDomain = domain.split('.').slice(-3);
    if (splittedDomain.length >= 3) {
      const subdomain = splittedDomain[0];
      const availableEnv = ['dev', 'beta'];
      // return isEnvDomain;
      const isEnvDomain = availableEnv.indexOf(subdomain) > -1;
      return isEnvDomain ? splittedDomain.join('.') : splittedDomain.slice(-2).join('.');
    } else {
      // for main aitheon.com domain and without org
      return splittedDomain.join('.');
    }
  }

  terminate() {
    this.genericConfirm.show({
      text: `Are you sure to terminate sandbox`,
      headlineText: 'Terminate',
      confirmText: 'Yes',
      callback: () => {
        this.sandboxesRestService.terminate(this.sandboxId).subscribe(() => {
          this.clearPingInterval();
          this.router.navigateByUrl('/sandboxes');
        });
      }
    });
  }

  onClose(modalRef: any, e?: Event) {
    modalRef.hide();
    this.submitted = false;
    this.activeProject = false;
  }

  onProjectSaved(project: Project) {
    this.sandboxesRestService.loadProject(this.sandboxId, project._id).subscribe(() => {
    });
  }

  searchChange(text: string) {
    this.searchName.next(text);
  }

  loadProject(projectId: string) {
    if (this.openProjectModalRef) {
      this.openProjectModalRef.hide();
    }
    this.sandboxesRestService.loadProject(this.sandboxId, projectId).subscribe(() => { });
  }

  clearPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
  }

  initPing() {
    this.clearPingInterval();
    this.pingInterval = setInterval(() => {
      this.sandboxesRestService.ping(this.sandboxId).subscribe((result: { status: Sandbox.StatusEnum }) => {
        if (result.status === Sandbox.StatusEnum.TERMINATED || this.sandbox.status === Sandbox.StatusEnum.SHUTTING_DOWN) {
          this.clearPingInterval();
          this.showTerminated();
        }
      });
    }, environment.pingSandboxTime);
  }

  openIoModal(project: Project) {
    this.loadGroups();
    this.projectIoModal = project;
    this.ioModalRef = this.BSmodalService.show(this.ioModal, { class: 'modal-xxl', backdrop: 'static' });
  }


  toggleProjectToSelect() {
    this.projectToSelect = !this.projectToSelect;
  }

  closeIoModal() {
    this.selectedSocketGroups = [];
    this.groups.map(group => {
      group['added'] = false;
    });
    this.ioModalRef.hide();
  }

  saveIoModal() {
    this.ioLoading = true;
    this.projectsRestService.addSocketGroups(this.projectIoModal._id, this.sandboxId, this.selectedSocketGroups)
      .pipe(delay(2000)).subscribe(res => {
        this.ioLoading = false;
        this.ioModalRef.hide();
        this.toastr.success('Groups Saved');
        this.loadProjects();
      }, error => {
        this.ioLoading = false;
        this.ioModalRef.hide();
        this.toastr.error(error.error.message || 'Error');
      });
  }

  selectGroup(group, event) {
    event.stopPropagation();
    // this.selectedSockets = [];
    const duplicateGroup = this.selectedSocketGroups.find(groupToFindId => {
      return groupToFindId === group._id;
    });

    if (duplicateGroup) {
      this.selectedSocketGroups = this.selectedSocketGroups.filter(groupToFilter => {
        return groupToFilter !== duplicateGroup;
      });
    } else {
      this.selectedSocketGroups.push(group._id);
    }
  }

  viewSocket(socket) {
    this.socketToView = socket;
  }

  openSettings(event?: Event) {
    if (event) {
      this.stopEvent(event);
    }
    this.loadProjects();
    this.projectSettingsModalRef = this.BSmodalService.show(this.projectSettingsModal, Object.assign({}, { class: 'custom-modal custom-modal--small' }));
  }

  showTerminated() {
    this.genericConfirm.show({
      text: `Sandbox is shutting down or terminated`,
      headlineText: 'Sandbox terminated',
      confirmText: 'Open dashboard',
      hideNoButton: true,
      callback: () => {
        this.router.navigateByUrl('/sandboxes');
      }
    });
  }

  showInactivityWarning() {
    let timeToAction = 5 * 60 * 1000;
    this.clearPingInterval();
    clearInterval(this.inactivityWarningInterval);
    const data = {
      text: `Due to inactivity sandbox will shut down in ${this.msToTime(timeToAction)}`,
      headlineText: 'Inactivity Warning',
      confirmText: 'Close',
      hideNoButton: true,
      callback: () => {
        // this.router.navigateByUrl('/sandboxes');
        // this.initPing();
        clearInterval(this.inactivityWarningInterval);
      }
    };
    this.inactivityWarningInterval = setInterval(() => {
      timeToAction -= 1000;
      if (timeToAction <= 0) {
        clearInterval(this.inactivityWarningInterval);
        this.genericConfirm.hide();
        this.sandboxesRestService.terminate(this.sandboxId).subscribe(() => {
          this.clearPingInterval();
          this.router.navigateByUrl('/sandboxes');
        });
      }
      data.text = `Due to inactivity sandbox will shut down in ${this.msToTime(timeToAction)}`;
    }, 1000);
    this.genericConfirm.show(data);
  }

  msToTime(duration: number) {
    const milliseconds = parseInt(((duration % 1000) / 100).toString(), 0);
    const seconds = parseInt(((duration / 1000) % 60).toString(), 0);
    const minutes = parseInt(((duration / (1000 * 60)) % 60).toString(), 0);
    const hours = parseInt(((duration / (1000 * 60 * 60)) % 24).toString(), 0);

    return `${(minutes < 10) ? '0' + minutes : minutes}:${(seconds < 10) ? '0' + seconds : seconds}`;
  }

  chooseProject(project: Project) {
    this.activeProject = project;
    this.sharedService.openModal('REQUEST_MODAL', {
      type: 'PROJECT',
      openSettingsWhenClose: true,
      data: project,
    });
    this.projectSettingsModalRef.hide();
  }

  getProjectMarketSettings() {
    this.onClose(this.projectSettingsModalRef);
  }

  getSettings(settings: MarketplaceSettings) {
    this.marketplaceSettings = settings;
  }

  listenToRequestModalClose() {
    this.sharedService.triggerOpenModal.subscribe(({ type }) => {
      if (type === 'SETTINGS_MODAL') {
        this.openSettings();
      }
    });
  }

  stopEvent(event: Event) {
    event.stopPropagation();
    event.preventDefault();
  }

  ngOnDestroy(): void {
    this.clearPingInterval();
    clearInterval(this.inactivityWarningInterval);
    this.automationTrackerService.startChecker(this.sandboxId);
  }

  openBuildStatus() {
    this.buildStatusComponent.show();
  }

  openComponentInstaller() {
    this.componentInstallerComponent.openInstaller(this.sandboxId);
  }


  clearSearch(event: any) {

  }

  openReleasesModal() {
    this.modalService.openModal('RELEASES_MODAL');
  }
}
