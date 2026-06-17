export const vars = {
    product_name: 'Brekkie',
    product_description:
        'An AI chatbot that generates personalised recipes based on your dietary preferences and goals.',
    research_goal:
        'Understand why users stop using Brekkie after trying it and what would make them come back',
    participant_email: 'test@example.com',
    current_date: new Date().toISOString().split('T')[0],
}

export const realConversation = [
    {
        role: 'agent' as const,
        timeInCallSecs: 0,
        message:
            "Hi! Thanks for taking the time to chat. I'm going to ask you a few questions about Brekkie — there are no right or wrong answers, I just want to hear your honest experience. Ready to get started?",
    },
    { role: 'user' as const, timeInCallSecs: 12, message: 'Yes.' },
    {
        role: 'agent' as const,
        timeInCallSecs: 13,
        message:
            'Great. So, when you got a recipe from Brekkie, what did you do with it? Did it actually make it into your week?',
    },
    {
        role: 'user' as const,
        timeInCallSecs: 23,
        message:
            "I tried to use it once, but it wasn't really that convenient 'cause I cannot access the recipe without going to the website. The phone experience isn't that great either. So there are a lot of barriers to using it.",
    },
    {
        role: 'agent' as const,
        timeInCallSecs: 49,
        message:
            'I hear that — can you tell me more about what made the phone experience not so great?',
    },
    {
        role: 'user' as const,
        timeInCallSecs: 59,
        message:
            "The website doesn't look like it was built with a mobile experience in mind. The recipe is really long. There are a lot of dropdowns and UI components that don't really make sense on a phone. It looked great on a laptop but on my iPhone it doesn't feel easy to follow.",
    },
    {
        role: 'agent' as const,
        timeInCallSecs: 113,
        message: 'What would have to be different for you to use Brekkie more than once?',
    },
    {
        role: 'user' as const,
        timeInCallSecs: 124,
        message:
            "Maybe have a way to download the recipe onto my phone, or make the recipe preview easier to access. I also noticed it's a chatbot for recipe generation and meal planning, but I don't really care about the chat experience. I just want my recipes. And I want to be able to meal plan — right now I have to generate a recipe every time which is annoying.",
    },
    {
        role: 'agent' as const,
        timeInCallSecs: 175,
        message:
            'You mentioned not being interested in the chat aspect — what would you prefer instead?',
    },
    {
        role: 'user' as const,
        timeInCallSecs: 188,
        message:
            'I want a vault for my recipes. I want my recipes to be on the forefront instead of just chatting. I just want good, usable, practical recipes, be able to plan meals throughout my week with nutrition and diet in mind. Right now it feels like a ChatGPT wrapper.',
    },
]
