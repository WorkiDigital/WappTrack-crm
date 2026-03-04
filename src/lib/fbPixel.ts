
// Facebook Pixel utility functions

declare global {
  interface Window {
    fbq: any;
    _fbq: any; // Add _fbq to the window interface
    fbPixelInitialized?: boolean; // Add a flag to track initialization
    fbDebug?: boolean; // Add a debug flag
  }
}

/**
 * Initializes the Facebook Pixel with the given ID
 * @param pixelId The Facebook Pixel ID
 * @param debug Whether to display debug information
 */
export const initFacebookPixel = (pixelId?: string, debug: boolean = false) => {
  if (!pixelId) {
    console.warn('Facebook Pixel initialization failed: No Pixel ID provided');
    return false;
  }
  
  // Clean up the Pixel ID - remove any leading/trailing spaces
  const cleanPixelId = pixelId.trim();
  
  if (cleanPixelId === '') {
    console.warn('Facebook Pixel initialization failed: Empty Pixel ID after trimming');
    return false;
  }

  // Activate debug mode if requested
  window.fbDebug = debug;
  
  // Check if the pixel is already initialized
  if (window.fbPixelInitialized) {
    if (debug) console.log('Facebook Pixel already initialized with ID:', cleanPixelId);
    return true;
  }
  
  try {
    // Initialize Facebook Pixel
    const fbInitFunction = function(f: any, b: any, e: any, v: any, n: any, t: any, s: any) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; 
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      if (s && s.parentNode) { // Add null check
        s.parentNode.insertBefore(t, s);
      }
    };
    
    // Execute the function with all 7 required parameters
    fbInitFunction(
      window,
      document,
      'script',
      'https://connect.facebook.net/en_US/fbevents.js',
      null,  // n - will be assigned in the function
      null,  // t - will be assigned in the function
      null   // s - will be assigned in the function
    );
    
    window.fbq('init', cleanPixelId);
    window.fbPixelInitialized = true;
    
    if (debug) {
      console.log('Facebook Pixel initialized with ID:', cleanPixelId);
      // Add a visual indicator for debugging
      const debugDiv = document.createElement('div');
      debugDiv.style.position = 'fixed';
      debugDiv.style.bottom = '10px';
      debugDiv.style.right = '10px';
      debugDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      debugDiv.style.color = '#fff';
      debugDiv.style.padding = '5px 10px';
      debugDiv.style.borderRadius = '5px';
      debugDiv.style.fontSize = '12px';
      debugDiv.style.zIndex = '9999';
      debugDiv.id = 'fb-pixel-debug';
      debugDiv.innerHTML = `FB Pixel: ${cleanPixelId} initialized`;
      document.body.appendChild(debugDiv);
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing Facebook Pixel:', error);
    return false;
  }
};

/**
 * Tracks a PageView event
 */
export const trackPageView = () => {
  if (!window.fbq) {
    console.warn('Facebook Pixel not initialized. Cannot track PageView.');
    return false;
  }
  
  try {
    window.fbq('track', 'PageView');
    if (window.fbDebug) {
      console.log('Facebook Pixel PageView event tracked');
      updateDebugDiv('PageView tracked');
    }
    return true;
  } catch (error) {
    console.error('Error tracking PageView event:', error);
    return false;
  }
};

/**
 * Tracks a Lead event
 * @param value Optional value of the lead
 * @param currency Optional currency code
 */
export const trackLead = (value?: number, currency: string = 'BRL') => {
  if (!window.fbq) {
    console.warn('Facebook Pixel not initialized. Cannot track Lead.');
    return false;
  }
  
  try {
    const params = value ? { value, currency } : {};
    window.fbq('track', 'Lead', params);
    if (window.fbDebug) {
      console.log('Facebook Pixel Lead event tracked', params);
      updateDebugDiv('Lead tracked', params);
    }
    return true;
  } catch (error) {
    console.error('Error tracking Lead event:', error);
    return false;
  }
};

/**
 * Tracks a Contact event
 */
export const trackContact = () => {
  if (!window.fbq) {
    console.warn('Facebook Pixel not initialized. Cannot track Contact.');
    return false;
  }
  
  try {
    window.fbq('track', 'Contact');
    if (window.fbDebug) {
      console.log('Facebook Pixel Contact event tracked');
      updateDebugDiv('Contact tracked');
    }
    return true;
  } catch (error) {
    console.error('Error tracking Contact event:', error);
    return false;
  }
};

/**
 * Tracks a Purchase event
 * @param value Value of the purchase
 * @param currency Currency code
 */
export const trackPurchase = (value: number, currency: string = 'BRL') => {
  if (!window.fbq) {
    console.warn('Facebook Pixel not initialized. Cannot track Purchase.');
    return false;
  }
  
  try {
    window.fbq('track', 'Purchase', { value, currency });
    if (window.fbDebug) {
      console.log('Facebook Pixel Purchase event tracked', { value, currency });
      updateDebugDiv('Purchase tracked', { value, currency });
    }
    return true;
  } catch (error) {
    console.error('Error tracking Purchase event:', error);
    return false;
  }
};

/**
 * Tracks an event based on the specified event type
 * @param eventType The type of event to track
 * @param value Optional value for the event
 * @returns boolean indicating success or failure
 */
export const trackEventByType = (eventType?: string, value?: number): boolean => {
  if (!eventType) {
    console.warn('No event type specified for tracking');
    return false;
  }
  
  switch (eventType) {
    case 'lead':
      return trackLead(value);
    case 'contact':
      return trackContact();
    case 'sale':
      return trackPurchase(value || 0);
    case 'page_view':
      return trackPageView();
    default:
      console.warn(`Unknown event type: ${eventType}, defaulting to PageView`);
      return trackPageView();
  }
};

/**
 * Helper function to update the debug div with event information
 */
const updateDebugDiv = (eventName: string, params?: Record<string, any>) => {
  const debugDiv = document.getElementById('fb-pixel-debug');
  if (debugDiv) {
    const now = new Date();
    const timestamp = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
    const paramsText = params ? ` ${JSON.stringify(params)}` : '';
    debugDiv.innerHTML = `${timestamp} - ${eventName}${paramsText}`;
  }
};

/**
 * Toggles debug mode for Facebook Pixel
 */
export const togglePixelDebug = (enabled: boolean) => {
  window.fbDebug = enabled;
  
  if (enabled) {
    if (!document.getElementById('fb-pixel-debug')) {
      const debugDiv = document.createElement('div');
      debugDiv.style.position = 'fixed';
      debugDiv.style.bottom = '10px';
      debugDiv.style.right = '10px';
      debugDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      debugDiv.style.color = '#fff';
      debugDiv.style.padding = '5px 10px';
      debugDiv.style.borderRadius = '5px';
      debugDiv.style.fontSize = '12px';
      debugDiv.style.zIndex = '9999';
      debugDiv.id = 'fb-pixel-debug';
      debugDiv.innerHTML = 'FB Pixel Debug Mode';
      document.body.appendChild(debugDiv);
    }
  } else {
    const debugDiv = document.getElementById('fb-pixel-debug');
    if (debugDiv) {
      debugDiv.remove();
    }
  }
  
  return enabled;
};
