// Career quiz data and configuration
const careerQuiz = {
  title: "BCIT Connect – Career Path Quiz",
  description: "Discover which tech career suits you best!",
  questions: [
    {
      id: 1,
      question: "How would your classmates or teammates describe you?",
      options: [
        "Someone who genuinely cares about others and always offers support",
        "A driven, ambitious person bursting with creative energy",
        "A design-savvy thinker with a great eye for layout and visuals",
        "A strategic planner who takes the lead and organizes the group",
        "A hands-on builder who loves solving tough problems",
        "A people-focused teammate who makes everything more intuitive",
        "A logical thinker who enjoys working with numbers and efficiency",
      ],
    },
    {
      id: 2,
      question: "If you had to take one BCIT elective today, which would you choose?",
      options: [
        "Introduction to Human Psychology",
        "Discrete Mathematics",
        "Digital Marketing Essentials",
        "Graphic Design Fundamentals",
        "Agile Project Management",
        "Advanced Web Development"
      ]
    },
    {
      id: 3,
      question: "Which type of task sounds most enjoyable to you?",
      options: [
        "Analyzing data patterns using Excel or SQL",
        "Collaborating with peers to map out a product roadmap",
        "Interviewing users to better understand their needs",
        "Building an interactive app from scratch using JavaScript",
        "Designing a sleek and engaging user interface",
        "Writing compelling copy and messages for a product launch"
      ]
    },
    {
      id: 4,
      question: "You and your team are launching a student startup. What role would you naturally take?",
      options: [
        "Project coordinator ensuring deadlines and communication",
        "Visual designer crafting the logo and brand theme",
        "Analyst identifying where to grow and improve",
        "Campaign manager running digital ads and outreach",
        "Backend developer setting up the servers and logic",
        "UX researcher making sure the app meets user needs"
      ]
    },
    {
      id: 5,
      question: "What’s your ideal workday in the tech industry?",
      options: [
        "A few hours of focused creative time in Figma or Photoshop",
        "Diving deep into spreadsheets, performance logs, or scripts",
        "Coordinating the project pipeline and updating team boards",
        "Collaborating with devs to brainstorm interface ideas",
        "Fixing bugs and shipping features after stand-up",
        "Presenting progress to stakeholders and collecting feedback",
        "Reviewing KPIs and strategizing improvements"
      ]
    },
    {
      id: 6,
      question: "Which type of challenge are you most excited to solve?",
      options: [
        "Optimizing the checkout flow on an eCommerce app",
        "Redesigning a mobile app to make it more accessible",
        "Boosting campaign effectiveness through better messaging",
        "Forecasting user growth with data modeling",
        "Incorporating feedback into a better product design",
        "Creating a structured dev workflow for the team",
        "Debugging a persistent backend error"
      ]
    },
    {
      id: 7,
      question: "What aspect of your future tech career excites you most?",
      options: [
        "Playing a key role in a successful launch or product",
        "Knowing your work improves real users’ lives",
        "Seeing your designs or campaigns reach a wide audience",
        "Having the freedom to be both creative and technical",
        "Building functional tools or systems from scratch",
        "Making strategic decisions that impact outcomes",
        "Continuously learning new tools, languages, and trends"
      ]
    },
    {
      id: 8,
      question: "When you set up a new phone, what do you do first?",
      options: [
        "Customize the home screen and widgets",
        "Rearrange icons and shortcuts for convenience",
        "Install your must-have apps first",
        "Restore all saved data and configs",
        "Send your new number to friends",
        "Read the manual to understand all features",
        "Set a custom wallpaper and theme"
      ]
    },
    {
      id: 9,
      question: "You’re about to launch a new student app. What’s your top priority?",
      options: [
        "Making sure it’s been tested with real users",
        "Ensuring the UI is intuitive and accessible",
        "Staying on budget and delivering on time",
        "Eliminating bugs and ensuring stability",
        "Creating a strong marketing campaign",
        "Designing a stunning and on-brand interface",
        "Solving a real, meaningful student problem"
      ]
    }
  ],
};

// Career recommendation prompt template
const generateCareerPrompt = (quizAnswers, userProfile) => {
  return `
    You are a career advisor. Based on the answers given to these questions (Q&A), as-well as the profile recommend 3 tech career paths that would match.
    Your entire response should be in json format for each career:
    
    [ {
      "career_name": "[Official Career Name]",
      "description": "[1-paragraph overview of what the career entails.]",
      "key_skills": [
        "Skill1",
        "Skill2",
        "Skill3",
        "Skill4",
        "Skill5",
        "Skill6",
        "Skill7",
        "Skill8",
        "Skill9",
        "Skill10"
      ],
      "education_requirements": "[Typical degree(s) or certifications needed for this role.]",
      "industry_demand": "[Brief summary of how in-demand the role is, future outlook, or current shortages.]",
      "work_environment": "[Office-based, remote, lab, field work, team-based, solo, etc.]",
      "career_growth_opportunities": "[Paths for advancement, management, specialization, freelancing, etc.]",
      "average_salary": "$[Yearly Salary]",
      "starting_salary_range": "$[68,000 – 80,000]",
      "median_salary_range": "$[68,000 – 80,000]",
      "similar_roles": [
        "Role1",
        "Role2",
        "Role3",
        "Role4",
        "Role5"
      ],
      "why_it_suits_me": "[How your skills, personality, and goals align with this role.]",
      "why_best_fit": "[A persuasive case: passion, alignment with long-term goals, strengths, lifestyle compatibility, etc.]"
    }]
    
    Q&A: 
    ${quizAnswers}
    
    Profile: 
    ${JSON.stringify(userProfile, null, 2)}
    
    Return the Json list of only careers that strongly align based on the user's answers and background.Make sure the json is parsable and valid`;
};

module.exports = {
  careerQuiz,
  generateCareerPrompt
}; 