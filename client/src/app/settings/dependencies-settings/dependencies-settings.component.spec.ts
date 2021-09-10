import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DependenciesSettingsComponent } from './dependencies-settings.component';

describe('DependenciesSettingsComponent', () => {
  let component: DependenciesSettingsComponent;
  let fixture: ComponentFixture<DependenciesSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DependenciesSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DependenciesSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
