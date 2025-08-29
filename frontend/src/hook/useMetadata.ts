import { useEffect } from 'react';

interface MetadataConfig {
  title: string;
  description: string;
  imageUrl?: string;
}

export const useMetadata = (config: MetadataConfig | null) => {
  useEffect(() => {
    if (config) {
      // Update document title
      document.title = config.title;

      // Update meta description
      updateMetaDescription(config.description);

      // Update Open Graph tags
      updateOpenGraphTags(config.title, config.description, config.imageUrl);

      // Update Twitter Card tags
      updateTwitterCardTags(config.title, config.description, config.imageUrl);
    } else {
      // Reset to default
      document.title = "POTLAUNCH";
      updateMetaDescription("POTLAUNCH by POTLOCK - Launch your project with community funding!");
      updateOpenGraphTags("POTLAUNCH by POTLOCK", "Launch your project with community funding on POTLAUNCH by POTLOCK!", "/og-image.png");
      updateTwitterCardTags("POTLAUNCH by POTLOCK", "Launch your project with community funding on POTLAUNCH by POTLOCK!", "/og-image.png");
    }

    // Cleanup function
    return () => {
      document.title = "POTLAUNCH";
      updateMetaDescription("POTLAUNCH by POTLOCK - Launch your project with community funding!");
      updateOpenGraphTags("POTLAUNCH by POTLOCK", "Launch your project with community funding on POTLAUNCH by POTLOCK!", "/og-image.png");
      updateTwitterCardTags("POTLAUNCH by POTLOCK", "Launch your project with community funding on POTLAUNCH by POTLOCK!", "/og-image.png");
    };
  }, [config]);
};

// Helper functions to update meta tags
const updateMetaDescription = (description: string) => {
  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    document.head.appendChild(metaDescription);
  }
  metaDescription.setAttribute('content', description);
};

const updateOpenGraphTags = (title: string, description: string, imageUrl?: string) => {
  // Update og:title
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (!ogTitle) {
    ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    document.head.appendChild(ogTitle);
  }
  ogTitle.setAttribute('content', title);

  // Update og:description
  let ogDescription = document.querySelector('meta[property="og:description"]');
  if (!ogDescription) {
    ogDescription = document.createElement('meta');
    ogDescription.setAttribute('property', 'og:description');
    document.head.appendChild(ogDescription);
  }
  ogDescription.setAttribute('content', description);

  // Update og:image if imageUrl is provided
  if (imageUrl) {
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    ogImage.setAttribute('content', imageUrl);
  }
};

const updateTwitterCardTags = (title: string, description: string, imageUrl?: string) => {
  // Update twitter:title
  let twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (!twitterTitle) {
    twitterTitle = document.createElement('meta');
    twitterTitle.setAttribute('name', 'twitter:title');
    document.head.appendChild(twitterTitle);
  }
  twitterTitle.setAttribute('content', title);

  // Update twitter:description
  let twitterDescription = document.querySelector('meta[name="twitter:description"]');
  if (!twitterDescription) {
    twitterDescription = document.createElement('meta');
    twitterDescription.setAttribute('name', 'twitter:description');
    document.head.appendChild(twitterDescription);
  }
  twitterDescription.setAttribute('content', description);

  // Update twitter:image if imageUrl is provided
  if (imageUrl) {
    let twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (!twitterImage) {
      twitterImage = document.createElement('meta');
      twitterImage.setAttribute('name', 'twitter:image');
      document.head.appendChild(twitterImage);
    }
    twitterImage.setAttribute('content', imageUrl);
  }
};

// Utility function to set loading metadata
export const setLoadingMetadata = () => {
  document.title = "Loading - POTLAUNCH";
  updateMetaDescription("Loading...");
};

// Utility function to set error metadata
export const setErrorMetadata = (message: string = "An error occurred") => {
  document.title = "Error - POTLAUNCH";
  updateMetaDescription(message);
};
