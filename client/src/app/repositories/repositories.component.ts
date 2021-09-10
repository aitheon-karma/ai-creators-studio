import { Component, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AuthService } from '@aitheon/core-client';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'ai-repositories',
  templateUrl: './repositories.component.html',
  styleUrls: ['./repositories.component.scss']
})
export class RepositoriesComponent implements OnInit {

  url: string;

  constructor(
    private authService: AuthService,
    private activatedRoute: ActivatedRoute
  ) {
  }

  ngOnInit() {
    const username = this.activatedRoute.snapshot.params['username'];
    const repositoryName = this.activatedRoute.snapshot.params['repositoryName'];
    const commit = this.activatedRoute.snapshot.params['commit'];
    let url = `${ environment.baseApi }/git`;
    if (username && repositoryName) {
      url += `/${ username }/${ repositoryName }`;
    }
    if (commit) {
      url += `/commit/${ commit }`;
    }
    this.url = url;
  }

}
