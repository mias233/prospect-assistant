// User and Application Settings Service with LocalStorage persistence

const SETTINGS_KEY = 'prospect_assistant_user_settings';

export const DEFAULT_SETTINGS = {
  userName: 'John Doe',
  userInitials: 'JD',
  userRole: 'Web Growth Consultant',
  agencyName: 'GrowthPilot Studios',
  portfolioUrl: 'https://growthpilot.agency',
  defaultCountryCode: '91',
  preferredWhatsAppClient: 'app', // 'app' (WhatsApp Desktop) or 'web' (WhatsApp Web)
  defaultTone: 'Conversational', // 'Conversational', 'Direct', 'Value'
  autoCopyClipboard: true,
  enableDesktopNotifications: true,
  targetCity: 'Chennai, Tamil Nadu'
};

export const getSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load user settings:', e);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (newSettings) => {
  try {
    const updated = { ...getSettings(), ...newSettings };
    // update initials if name changed
    if (newSettings.userName) {
      const parts = newSettings.userName.trim().split(/\s+/);
      updated.userInitials = parts.length > 1 
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    // Trigger custom storage event so all components react immediately
    window.dispatchEvent(new Event('prospect_assistant_settings_updated'));
    return updated;
  } catch (e) {
    console.error('Failed to save user settings:', e);
    return newSettings;
  }
};
