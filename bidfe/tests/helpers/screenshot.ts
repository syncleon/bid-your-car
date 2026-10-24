import { Page, Locator, Browser, BrowserContext } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const BASE_ARTIFACT_DIR = process.env.ARTIFACT_DIR || '/Users/syncleon/.gemini/antigravity/brain/ecf77a68-9962-4f92-816f-7d353baf9717/screenshots';
export const BASE_LOCAL_DIR = path.resolve(__dirname, '../screenshots');

/**
 * Creates a dedicated screenshot saver for a test suite/module
 */
export function createScreenshotSaver(moduleName: string) {
  const artifactModuleDir = path.join(BASE_ARTIFACT_DIR, moduleName);
  const localModuleDir = path.join(BASE_LOCAL_DIR, moduleName);

  try {
    fs.mkdirSync(artifactModuleDir, { recursive: true });
    fs.mkdirSync(localModuleDir, { recursive: true });
  } catch (err) {
    console.warn(`Warning creating screenshot directories for ${moduleName}:`, err);
  }

  return async function saveStepScreenshot(
    pageOrLocator: Page | Locator,
    filename: string,
    options: Parameters<Page['screenshot']>[0] = {}
  ): Promise<void> {
    const artifactPath = path.join(artifactModuleDir, filename);
    const localPath = path.join(localModuleDir, filename);

    // Save to artifact directory
    await pageOrLocator.screenshot({ path: artifactPath, ...options });
    // Save to repository local directory
    await pageOrLocator.screenshot({ path: localPath, ...options });

    console.log(`📸 [${moduleName}] Saved screenshot: ${filename}`);
  };
}

/**
 * Creates an authenticated browser context and page with an auth token pre-stored
 */
export async function createAuthenticatedContext(
  browser: Browser,
  user: { username: string; password: string },
  viewport = { width: 1440, height: 900 }
): Promise<{ context: BrowserContext; page: Page; token?: string }> {
  const context = await browser.newContext({ viewport });
  
  try {
    const loginRes = await context.request.post('http://localhost:8080/api/v1/auth/login', {
      data: { username: user.username, password: user.password },
    });

    if (loginRes.ok()) {
      const data = await loginRes.json();
      const token = data.token;
      await context.addInitScript((authToken) => {
        localStorage.setItem('auth_token', authToken);
      }, token);
      const page = await context.newPage();
      return { context, page, token };
    } else {
      console.warn(`[AuthHelper] Failed login for user ${user.username}: ${loginRes.status()}`);
    }
  } catch (err) {
    console.warn(`[AuthHelper] Error logging in user ${user.username}:`, err);
  }

  const page = await context.newPage();
  return { context, page };
}
