import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { AuthService } from '@aitheon/core-client';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'ai-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  // tslint:disable-next-line:max-line-length
  // url = 'https://dev.aitheon.com/sandboxes/5e56c70ba4d5d67ab2f54793/?folder=vscode-remote%3A%2F%2Fdev.aitheon.com%2Fhome%2Fcoder%2Fworkspace';

  serviceName = 'Creators.Studio';
  navBarMenuData = [
    { title: 'Home', path: '/dashboard' },
    { title: 'Sandboxes', path: '/sandboxes' },
    { title: 'Repositories', path: '/repositories' },
    // { title: 'Admin', path: '/admin' },
  ];

  constructor(
    public authService: AuthService,
    public toastr: ToastrService, vcr: ViewContainerRef
  ) {
    // this.toastr.setRootViewContainerRef(vcr);
  }

  ngOnInit() {

  }

}
