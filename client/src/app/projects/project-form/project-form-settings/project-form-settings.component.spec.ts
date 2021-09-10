import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectFormSettingsComponent } from './project-form-settings.component';

describe('ProjectFormSettingsComponent', () => {
  let component: ProjectFormSettingsComponent;
  let fixture: ComponentFixture<ProjectFormSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectFormSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectFormSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
