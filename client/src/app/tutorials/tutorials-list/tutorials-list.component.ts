import { Component, OnInit } from '@angular/core';
import { TutorialsRestService, Tutorial } from '@aitheon/platform-support';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'ai-tutorials-list',
  templateUrl: './tutorials-list.component.html',
  styleUrls: ['./tutorials-list.component.scss']
})
export class TutorialsListComponent implements OnInit {
  tutorials: Tutorial[];

  constructor(
    private tutorialsRestService: TutorialsRestService,
  ) { }

  ngOnInit() {
    this.tutorialsRestService.getByService(environment.service).subscribe((tutorials: Tutorial[]) => {
      this.tutorials = tutorials;
    });
  }
}
