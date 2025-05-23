import { Component, inject, OnInit, HostListener, PLATFORM_ID, Inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthStateService } from '../../../../services/auth-state.service';
import { CartService } from '../../../../services/cart.service';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-header-main',
  imports: [CommonModule, RouterLink],
  templateUrl: './header-main.component.html',
  styleUrls: ['./header-main.component.css'],
  animations: [
    trigger('fadeInOut', [
      state('void', style({
        opacity: 0
      })),
      transition('void <=> *', animate('0.3s ease-in-out')),
    ])
  ],
  standalone: true
})
export class HeaderMainComponent implements OnInit {
  isLoggedIn: boolean = false;
  userName: string = '';
  userEmail: string = '';
  cartItemCount: number = 0;
  isScrolled: boolean = false;
  animationEnabled: boolean = true;
  
  authService = inject(AuthService);
  authState = inject(AuthStateService);
  cartService = inject(CartService);
  router: Router = inject(Router);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      this.isScrolled = window.scrollY > 50;
    }
  }

  ngOnInit(): void {
    // Enable initial animations only on first load
    this.animationEnabled = true;
    setTimeout(() => {
      this.animationEnabled = false;
    }, 1500);

    // Check login status
    this.authState.loginStatus$.subscribe((status: boolean) => {
      this.isLoggedIn = status;
    });

    const token = this.authService.getToken();
    this.authState.setLoginState(!!token);

    let userData: any = null;

    if (token) {
      userData = this.authService.decodedTokenData();
      this.userName = userData?.['Name'] || '';
      this.userEmail = userData?.['Email'] || '';
    }

    // Subscribe to cart item count from CartService
    this.cartService.cartItemCount$.subscribe((count: number) => {
      // Add animation to cart icon when count changes
      if (isPlatformBrowser(this.platformId) && count > 0 && this.cartItemCount !== count) {
        const cartIcon = document.querySelector('.animate-cart i');
        if (cartIcon) {
          cartIcon.classList.remove('cart-bounce');
          // Trigger reflow to restart animation - fixed with proper type casting
          void (cartIcon as HTMLElement).offsetWidth;
          cartIcon.classList.add('cart-bounce');
        }
      }
      
      this.cartItemCount = count;
    });
  }

  signOut(): void {
    if (confirm('Are you sure you want to sign out?')) {
      localStorage.removeItem('token');
      this.authState.setLoginState(false);
      this.router.navigate(['/login']);
    }
  }
}