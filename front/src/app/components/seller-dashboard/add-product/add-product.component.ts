import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../../services/product.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../services/auth.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { ElementRef } from '@angular/core';

@Component({
  selector: 'app-add-product',
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.css']
})
export class AddProductComponent {
  selectedFile: File | null = null;

  authService = inject(AuthService)
  userData:any = this.authService.decodedTokenData()

  sellerId:any = this.userData['CustomerId']

  productForm: FormGroup = new FormGroup({
    ProductCategory: new FormControl('', [Validators.required]),
    CustomCategory: new FormControl(''), // New field for custom category
    ProductName: new FormControl('', [Validators.required]),
    ProductPrice: new FormControl('', [Validators.required]),
    Description: new FormControl('', [Validators.required]),
    StockQuantity: new FormControl('', [Validators.required]),
    SellerId: new FormControl(this.sellerId, [Validators.required])
  });
 
   imagePreview: string | undefined;
  imageName: any;


  constructor(private productService: ProductService,private router: Router,private elementRef: ElementRef) {}

onSubmitClick() {
  if (this.productForm.invalid) {
    this.scrollToFirstInvalidControl();
    this.productForm.markAllAsTouched(); // shows all validation messages
    return;
  }

  this.submitProduct(); // your existing form submission logic
}
scrollToFirstInvalidControl() {
  const invalidControlKey = Object.keys(this.productForm.controls).find(key =>
    this.productForm.get(key)?.invalid
  );

  if (invalidControlKey) {
    const controlElement = this.elementRef.nativeElement.querySelector(`[formcontrolname="${invalidControlKey}"]`);
    if (controlElement) {
      controlElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      controlElement.focus();
    }
  }
}



  handleFileUpload(event: any) {
  if (event.target.files.length > 0) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.imagePreview = URL.createObjectURL(file);
      this.imageName = file.name; // Store image name
      console.log("Selected File:", this.selectedFile);
    }
  }
}

isOtherSelected: boolean = false; // Tracks "Others" selection

handleCategoryChange(event: any) {
  this.isOtherSelected = event.target.value === 'others';

  // Reset the custom category field when selecting other options
  if (!this.isOtherSelected) {
    this.productForm.patchValue({ CustomCategory: '' });
  }
}

submitProduct() {
  if (!this.selectedFile) {
    Swal.fire('Error', 'Please select an image.', 'error');
    return;
  }
  if (this.productForm.invalid) {
    this.scrollToFirstInvalidControl();
    this.productForm.markAllAsTouched();
    return;
  }

  if (this.productForm.invalid) {
    console.error("Form is invalid", this.productForm.errors);
     this.productForm.markAllAsTouched(); 
    // Find the first invalid field and focus on it
   for (const field in this.productForm.controls) {
  if (this.productForm.controls[field].invalid) {
    const element = document.querySelector(`[formControlName="${field}"]`);
    if (element) {
      setTimeout(() => {
        (element as HTMLElement).focus();
        (element as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
    }
    break;
    
  }
}
}
const formData = new FormData();
const selectedCategory = this.isOtherSelected ? this.productForm.value.CustomCategory : this.productForm.value.ProductCategory;
formData.append("ProductCategory", selectedCategory);
  Object.keys(this.productForm.value).forEach(key => {
    formData.append(key, this.productForm.value[key]);
  });
  formData.append("ProductImage", this.selectedFile, this.selectedFile.name);

  this.productService.addProduct(formData).subscribe({
    next: (response) => {
      Swal.fire({
        title: 'Product Added!',
        text: 'Do you want to go to the dashboard or add another product?',
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'Go to Dashboard',
        cancelButtonText: 'Add More Products'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/sellerdashboard']);
        } else {
          this.productForm.reset();
          this.selectedFile = null;
          this.imagePreview = undefined;
          this.imageName = null;
        }
      });
    },
    error: (error) => console.error("Error adding product", error),
  });
}
}
