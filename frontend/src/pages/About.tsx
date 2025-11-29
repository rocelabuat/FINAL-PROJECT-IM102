import React from "react";

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6 text-foreground">About Us</h1>
        <p className="text-lg text-muted-foreground mb-4">
          Welcome to Jesan's Fried Chicken! Our mission is to serve the crispiest,
          juiciest, and most flavorful fried chicken in town. We are passionate about
          delivering premium quality ingredients, perfectly seasoned recipes, and
          exceptional customer service.
        </p>
        <p className="text-lg text-muted-foreground mb-4">
          Since our inception, we have been dedicated to creating a delightful dining
          experience for every customer. Whether you dine in, take out, or order online,
          we ensure that each meal is crafted with care and attention to detail.
        </p>
        <p className="text-lg text-muted-foreground">
          Join us and taste the difference — Crispy. Juicy. Perfectly Fried!
        </p>
      </div>
    </div>
  );
};

export default About;
