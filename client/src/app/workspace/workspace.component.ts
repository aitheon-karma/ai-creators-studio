import { Component, OnInit, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { NavigationEnd, Router } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
// import { WidgetsGridComponent, WidgetsService } from '@aitheon/ui-widgets';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'ai-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss']
})
export class WorkspaceComponent implements OnInit {

  // @ViewChild('widgetsGrid') widgetsGrid: WidgetsGridComponent;

  loading = false;

  pingInterval: any;
  statusFetchInterval: any;

  appId = 1;
  actions = {
    id: '23123fsds3',
    text: 'console.log("app component widgets")',
  };

  routeParams: any;
  workspaceId: string;

  constructor(
  ) { }

  ngOnInit() {
    this.initPing();

  //   this.router.events
  //   .pipe(map((event => event instanceof NavigationEnd)))
  //   .subscribe((event) => {
  //     console.log('NavigationEnd, clearing intervals:', event);
  //     this.clearPingInterval();
  //     this.clearStatusFetchInterval();
  //   });
  //   this.routeParams = this.route.params.subscribe(params => {
  //     this.workspaceId = params['id']; // (+) converts string 'id' to a number
  //     console.log('Workspace ID: ' + this.workspaceId);
  //     this.loadWorkspace(this.workspaceId);
  //  });
  }

  launchApp() {
    // this.editorWebsocketService.buildApp(this.editorService.activeProject._id);
  }

  createRandomWorkspace() {
    // this.load('5bfc062c0c690bf44d0508dc');
    // this.editorWebsocketService.createWorkspace(`Workspace_${ (Math.random() * 1000).toFixed()}`);
  }

  clearPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
  }

  clearStatusFetchInterval() {
    if (this.statusFetchInterval) {
      clearInterval(this.statusFetchInterval);
    }
  }

  initPing() {
    // this.clearPingInterval();
    // this.pingInterval = setInterval(() => {
    //   if (this.editorService.session && !this.editorService.session.saving) {
    //     this.sessionsService.ping().subscribe(() => {
    //       console.log('ping session done');
    //     });
    //   }
    // }, environment.pingSessionTime);
  }


}
