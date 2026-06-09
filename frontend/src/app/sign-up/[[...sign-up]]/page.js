import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '90vh',
      width: '100%',
      padding: '40px 0',
    }}>
      <SignUp 
        appearance={{
          variables: {
            colorPrimary: '#8b5cf6',
            colorBackground: '#0d0f15',
            colorText: '#ffffff',
            colorTextSecondary: '#a0aec0',
            colorInputBackground: 'rgba(255, 255, 255, 0.06)',
            colorInputText: '#ffffff',
            colorBorder: 'rgba(255, 255, 255, 0.25)',
          },
          elements: {
            card: {
              background: 'rgba(13, 15, 21, 0.65)',
              backdropFilter: 'blur(25px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 8px 32px 0 rgba(139, 92, 246, 0.15)',
              padding: '24px 20px',
              maxWidth: '420px',
              width: '100%',
              borderRadius: '20px',
            },
            headerTitle: { 
              color: '#ffffff',
              fontSize: '1.4rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #fff 0%, #a855f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '2px'
            },
            headerSubtitle: { color: '#a0aec0', fontSize: '0.8rem', marginBottom: '8px' },
            socialButtonsBlockButton: {
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              height: '36px',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.08)',
                borderColor: 'rgba(255, 255, 255, 0.35)',
              }
            },
            socialButtonsBlockButtonText: { color: '#ffffff', fontSize: '0.8rem' },
            dividerLine: { background: 'rgba(255, 255, 255, 0.1)' },
            dividerText: { color: '#a0aec0', fontSize: '0.7rem' },
            formFieldLabel: { color: '#ffffff', fontSize: '0.78rem', fontWeight: '500', marginBottom: '2px' },
            formFieldInput: {
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              height: '36px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              padding: '6px 12px',
              transition: 'all 0.2s ease',
              '&:focus': {
                borderColor: '#8b5cf6',
                background: 'rgba(255, 255, 255, 0.1)',
                boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.25)',
              }
            },
            formButtonPrimary: {
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              height: '36px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600',
              marginTop: '8px',
              transition: 'all 0.2s ease',
              '&:hover': {
                filter: 'brightness(1.15)',
              }
            },
            footerActionText: { color: '#a0aec0', fontSize: '0.75rem' },
            footerActionLink: { color: '#8b5cf6', fontSize: '0.75rem' }
          }
        }}
      />
    </div>
  );
}
