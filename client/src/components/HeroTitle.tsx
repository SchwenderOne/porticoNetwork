import React from 'react';

interface HeroTitleProps {
  title: string;
  subtitle: string;
}

const HeroTitle: React.FC<HeroTitleProps> = ({ title, subtitle }) => {
  return (
    <section className="text-center mb-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
      <p className="text-secondary-foreground max-w-2xl mx-auto">
        {subtitle}
      </p>
    </section>
  );
};

export default HeroTitle;
