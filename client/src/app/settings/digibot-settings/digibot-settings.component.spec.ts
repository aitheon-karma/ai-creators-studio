import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DigibotSettingsComponent } from './digibot-settings.component';

describe('DigibotSettingsComponent', () => {
  let component: DigibotSettingsComponent;
  let fixture: ComponentFixture<DigibotSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DigibotSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DigibotSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
