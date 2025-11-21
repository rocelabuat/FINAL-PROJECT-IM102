import React from "react";

const Contact: React.FC = () => {
  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6 text-foreground">Contact Us</h1>
        <p className="text-lg text-muted-foreground mb-4">
          We are open daily to serve you fresh and delicious fried chicken.  
          <strong> Operating Hours:</strong> 8:00 AM - 9:00 PM
        </p>
        <p className="text-lg text-muted-foreground mb-4">
          <strong>Call Us:</strong> 0912-345-6789
        </p>
        <p className="text-lg text-muted-foreground">
          <strong>Location:</strong> Sta. Ana Ave, Poblacion District, Davao City, 8000 Davao del Sur
        </p>
      </div>
    </div>
  );
};

export default Contact;
