// portfolio.js - Dynamic rendering for portfolio page

async function loadProjects() {
    try {
        const response = await fetch('./projects/projects.json');
        const projects = await response.json();
        renderProjects(projects);
    } catch (error) {
        console.error('Error loading projects:', error);
        // Fallback to show error message or empty state
        document.querySelector('.project-list').innerHTML = '<p>Error loading projects. Please try again later.</p>';
    }
}

function renderProjects(projects) {
    const projectList = document.querySelector('.project-list');
    projectList.innerHTML = ''; // Clear existing content
    
    projects.forEach(project => {
        const projectBox = createProjectBox(project);
        projectList.appendChild(projectBox);
    });
}

function createProjectBox(project) {
    const projectBox = document.createElement('div');
    projectBox.className = 'project-preview-box';
    
    // Create title
    const title = document.createElement('h3');
    title.textContent = project.title;
    projectBox.appendChild(title);
    
    // Create year
    const year = document.createElement('p');
    year.innerHTML = `<b>Year:</b> ${project.year}`;
    projectBox.appendChild(year);
    
    // Create technologies (if exists)
    if (project.technologies && project.technologies.trim()) {
        const technologies = document.createElement('p');
        technologies.innerHTML = `<b>Technologies:</b> ${project.technologies}`;
        projectBox.appendChild(technologies);
    }
    
    // Create advisors (if exists)
    if (project.advisors && project.advisors.trim()) {
        const advisors = document.createElement('p');
        advisors.innerHTML = `<b>Advisor(s):</b> ${project.advisors}`;
        projectBox.appendChild(advisors);
    }
    
    // Create collaborators (if exists)
    if (project.collaborators && project.collaborators.trim()) {
        const collaborators = document.createElement('p');
        collaborators.innerHTML = `<b>Collaborator(s):</b> ${project.collaborators}`;
        projectBox.appendChild(collaborators);
    }
    
    // Create description
    const description = document.createElement('p');
    description.textContent = project.description;
    projectBox.appendChild(description);
    
    // Create links
    if (project.links && project.links.length > 0) {
        project.links.forEach((link, index) => {
            const linkElement = document.createElement('a');
            linkElement.href = link.url;
            linkElement.target = '_blank';
            linkElement.className = 'project-link';
            linkElement.textContent = link.text;
            projectBox.appendChild(linkElement);
            
            // Add separator after each link except the last one
            if (index < project.links.length - 1) {
                const separator = document.createElement('span');
                separator.textContent = ' • ';
                separator.style.color = '#666';
                projectBox.appendChild(separator);
            }
        });
    }
    
    return projectBox;
}

// Load projects when the page loads
document.addEventListener('DOMContentLoaded', loadProjects);