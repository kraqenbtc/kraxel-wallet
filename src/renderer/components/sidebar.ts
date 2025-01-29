document.addEventListener('DOMContentLoaded', async (): Promise<void> => {
  try {
    const sidebarElement = document.getElementById('sidebar');
    if (!sidebarElement) return;

    // Load sidebar content using our preload API
    const html = await window.app.loadSidebarContent();
    sidebarElement.innerHTML = html;

    // Get current page from URL
    const currentPage: string = window.location.pathname.split('/').pop()?.replace('.html', '') || 'dashboard';
    
    // Find all nav links
    const navLinks: NodeListOf<HTMLAnchorElement> = document.querySelectorAll('.nav-link');
    
    // Update active state
    navLinks.forEach((link: HTMLAnchorElement): void => {
      const page: string | null = link.getAttribute('data-page');
      if (page && (currentPage === page || (currentPage === '' && page === 'dashboard'))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  } catch (error) {
    console.error('Failed to load sidebar:', error);
  }
}); 