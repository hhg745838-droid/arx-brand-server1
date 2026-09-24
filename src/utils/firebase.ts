export interface KeyValidationResult {
  valid: boolean;
  message: string;
  source: 'encrypted-secure-gateway';
  keyData?: {
    key: string;
    plan?: string;
    expiryText?: string;
  };
}

/**
 * 100% SHIELDED & SECURE VIP KEY VALIDATION
 * Uses server-side protected proxy route /api/verify-key.
 * The client NEVER talks directly to the database, completely hiding database URLs,
 * credentials, and keys from browser inspection.
 */
export async function verifyVipKeyWithFirebase(inputKey: string): Promise<KeyValidationResult> {
  const trimmed = inputKey.trim();
  if (!trimmed) {
    return {
      valid: false,
      message: 'অনুগ্রহ করে VIP কী প্রবেশ করান।',
      source: 'encrypted-secure-gateway',
    };
  }

  try {
    const response = await fetch('/api/verify-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key: trimmed }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        const data = await response.json().catch(() => ({}));
        return {
          valid: false,
          message: data.message || 'অতিরিক্ত চেষ্টার কারণে সাময়িক লক। ১ মিনিট পর চেষ্টা করুন।',
          source: 'encrypted-secure-gateway',
        };
      }
      return {
        valid: false,
        message: 'ভুল VIP কী! ডাটাবেস এডমিন প্যানেলের সঠিক পেইড কী প্রদান করুন।',
        source: 'encrypted-secure-gateway',
      };
    }

    const data = await response.json();
    if (data.valid) {
      return {
        valid: true,
        message: 'VIP Key Verified · Access Granted',
        source: 'encrypted-secure-gateway',
        keyData: {
          key: trimmed,
          plan: data.plan || 'PAID VIP',
          expiryText: data.expiryText || 'Active VIP',
        },
      };
    }

    return {
      valid: false,
      message: data.message || 'ভুল VIP কী! ডাটাবেস এডমিন প্যানেলের সঠিক পেইড কী প্রদান করুন।',
      source: 'encrypted-secure-gateway',
    };
  } catch (err) {
    return {
      valid: false,
      message: 'সিকিউর গেটওয়েতে যোগাযোগ করা যাচ্ছে না। পুনরায় চেষ্টা করুন।',
      source: 'encrypted-secure-gateway',
    };
  }
}
