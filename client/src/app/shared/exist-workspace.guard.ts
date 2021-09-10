import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExistWorkspaceGuard implements CanActivate {

  constructor(
    // private editorWebsocketService: EditorWebsocketService,
    private router: Router
  ) {

  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    // if (this.getSession()) {
    //   return true;
    // }
    return false;
  }

  getSession() {
    // return this.editorWebsocketService.sessionDetail.subscribe((session: Session) => {
    //     if (session.workspace) {
    //       return true;
    //     } else {
    //       this.router.navigateByUrl('/dashboard');
    //       return false;
    //     }
    //   });
  }
}
