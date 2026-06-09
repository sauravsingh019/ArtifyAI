import { ClerkProvider } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import Sidebar from '@/components/Sidebar';
import './globals.css';

export const metadata = {
  title: 'Artify — Creative Space for 3D & AI Artists',
  description: 'Design, generate, edit, and collaborate in the ultimate playground for 3D developers and AI creators.',
};

export default function RootLayout({ children }) {
  const { userId } = auth(); // Fetch user id from active session server-side

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#8b5cf6',
          colorBackground: '#0d0f15',
          colorText: '#ffffff',
          colorTextSecondary: '#ffffff',
          colorTextOnPrimaryBackground: '#ffffff',
          colorInputText: '#ffffff',
          colorInputBackground: '#08090d',
          colorBorder: 'rgba(255, 255, 255, 0.08)',
          fontFamily: 'Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
        elements: {
          profileSectionPrimaryButton: {
            color: '#ffffff',
            fontWeight: '600',
          },
          fileDropAreaHint: {
            color: '#a0aec0',
          },
          avatarImageActionsUpload: {
            color: '#ffffff',
            fontWeight: '600',
          },
          formButtonReset: {
            color: '#ffffff',
          },
        },
      }}

    >
      <html lang="en">
        <body>
          {userId ? (
            // User Logged In: Render sidebar and left offset
            <div className="layout-container">
              <Sidebar />
              <main className="main-content">
                {children}
              </main>
            </div>
          ) : (
            // Guest Session: Render full screen layout without sidebar
            <div className="layout-full">
              <main className="main-content-full">
                {children}
              </main>
            </div>
          )}
        </body>
      </html>
    </ClerkProvider>
  );
}
