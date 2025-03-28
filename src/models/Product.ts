export class Product {
    constructor(
      public id: string,
      public name: string,
      public description: string,
      public price: number,
      public stock_quantity: number,
      public category_id: number, // Changed to number to match Supabase
      public image_url: string,
      public created_at: Date,
      public updated_at: Date,
      public rating: number,
      public is_featured: boolean
    ) {}
  
    // Method to check if the product is in stock
    isInStock(): boolean {
      return this.stock_quantity > 0;
    }
  
    // Method to get a short description
    getShortDescription(length: number = 50): string {
      return this.description.length > length
        ? `${this.description.substring(0, length)}...`
        : this.description;
    }
  
    // Method to format price (e.g., $19.99)
    getFormattedPrice(currency: string = "$"): string {
      return `${currency}${this.price.toFixed(2)}`;
    }
  }
  