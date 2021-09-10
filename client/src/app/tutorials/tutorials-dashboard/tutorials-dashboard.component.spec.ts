import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TutorialsDashboardComponent } from './tutorials-dashboard.component';

describe('TutorialsDashboardComponent', () => {
  let component: TutorialsDashboardComponent;
  let fixture: ComponentFixture<TutorialsDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TutorialsDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TutorialsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
