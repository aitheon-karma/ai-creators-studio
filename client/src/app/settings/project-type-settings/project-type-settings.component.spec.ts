import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTypeSettingsComponent } from './project-type-settings.component';

describe('ProjectTypeSettingsComponent', () => {
  let component: ProjectTypeSettingsComponent;
  let fixture: ComponentFixture<ProjectTypeSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectTypeSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectTypeSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
