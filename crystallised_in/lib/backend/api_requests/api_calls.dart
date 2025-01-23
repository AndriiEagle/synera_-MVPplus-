import 'dart:convert';

import 'package:flutter/foundation.dart';

import '/flutter_flow/flutter_flow_util.dart';
import 'api_manager.dart';

export 'api_manager.dart' show ApiCallResponse;

const _kPrivateApiFunctionName = 'ffPrivateApiCall';

class TextToTextJsonProfileCall {
  static Future<ApiCallResponse> call({
    String? apiKeyAuth = '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',
    String? userRecordingTranscript =
        'Having spent a year in Zurich, I still feel new to the city. I\'m interested in discovering dynamic groups or communities where I can engage with locals and expatriates alike. What are some recommended ways to connect with people in Zurich, and how do Swiss people typically enjoy their leisure time',
    String? twelveSphereExplanation =
        '1 - Health: Focus on physical health, nutrition, regular physical activity, and self-care. 2 - Emotions: Development of emotional resilience, stress management, and empathic abilities. 3 - Spirit: Searching for personal meaning and goals, developing inner peace, and engaging in meditative practices. 4 - Intellect: Learning, reading, developing critical thinking, and continuous education. 5 - Character: Developing personal qualities such as honesty, responsibility, and respect for others. 6 - Networking: Strengthening friendships and social connections, networking and communication. 7 - Career: Developing professional skills, advancing in career paths, and achieving work-related goals. 8 - Finances: Managing personal finances, investing, and budget planning. 9 - Drive&Chill: Enjoying leisure time, hobbies, traveling, and relaxation. 10 - Family: Strengthening family bonds, mutual support, and interaction with relatives. 11 - Love: Building and maintaining romantic relationships, communicating with a partner. 12 - Balance: Finding harmony and resonance among all spheres, managing time and resources to achieve a balanced and fulfilling life.',
    String? userProfileAboutMe =
        'Hello, I\'m Dino Smuc, the founder of [CrystalisedIn], a pioneering social network driven by geolocation technology. With a background in web development and applied artificial intelligence, I\'ve leveraged my skills to create an app that connects people with their local community and like-minded individuals based on their current location. Our app not only facilitates networking and friendship-building but also integrates advanced features such as AI matching systems and voice recognition to enhance user interaction and engagement. I\'m passionate about using innovative technology to bring people together and am always looking for opportunities to collaborate and expand the reach of [CrystalisedIn]. Let\'s connect and explore how we can drive social connectivity forward together.',
    String? exampleOfDesiredOutput =
        'Example output here - {\\\"values\\\":{\\\"give\\\":[{\\\"string_representation\\\":\\\"I can offer insights on leveraging geolocation technology to foster community engagement, integrating these insights to enhance social connections and user interaction.\\\",\\\"sphere_of_life\\\":\\\"Intellect\\\"},{\\\"string_representation\\\":\\\"I can provide guidance on implementing AI matching systems to enhance user interactions, using this to improve community building and engagement.\\\",\\\"sphere_of_life\\\":\\\"Intellect\\\"},{\\\"string_representation\\\":\\\"I can help with integrating voice recognition technology into social networking platforms, which can further facilitate seamless communication and interaction.\\\",\\\"sphere_of_life\\\":\\\"Intellect\\\"},{\\\"string_representation\\\":\\\"I can share my experiences in developing and scaling a social networking platform, and how combining various technologies can lead to successful community building.\\\",\\\"sphere_of_life\\\":\\\"Career\\\"}],\\\"take\\\":[{\\\"string_representation\\\":\\\"What are some recommended ways to connect with people in Zurich, especially dynamic groups or communities that include both locals and expatriates? I\'m interested in how these connections can enhance my personal and professional life.\\\",\\\"sphere_of_life\\\":\\\"Networking\\\"},{\\\"string_representation\\\":\\\"What are popular activities or places in Zurich to experience local culture and lifestyle, which can also serve as great venues for meeting new people and networking?\\\",\\\"sphere_of_life\\\":\\\"Drive&Chill\\\"},{\\\"string_representation\\\":\\\"How do Swiss people typically enjoy their leisure time? Understanding this can help me find common ground and engage more effectively with locals.\\\",\\\"sphere_of_life\\\":\\\"Drive&Chill\\\"}]}}.',
  }) async {
    final ffApiRequestBody = '''
{
  "model": "gpt-4o",
  "temperature": 0.1,
  "max_tokens": 4000,
  "top_p": 0.1,
  "frequency_penalty": 0,
  "presence_penalty": 0,
  "response_format": {
    "type": "json_object"
  },
  "messages": [
    {
      "role": "system",
      "content": "Return a JSON object containing analyzed data from my recording transcript. Extract key points that I mention, separating them into categories: 'give' and 'take'. 'Give' encompasses values, knowledge, and skills that I can offer to others based on my experiences and insights. 'Take' includes my requests or desires to gain new knowledge, skills, or experiences in various aspects of life. If a single sentence contains multiple values pertaining to different spheres of life, enumerate and explain each clearly. For each category, create an array with objects. Populate 'string_representation' fields with the basic points raised and 'sphere_of_life' fields with the aspects of life they pertain to, each as separate entities sorted in order of mention. For 'improved_representation', ensure that the response is in the first person and significantly elevates the analysis without changing the original intent or content. Only include real-life examples if they are mentioned in the original text and ensure not to introduce actions or proposals not originally suggested. There are only these spheres of life - 1 - Health: Focus on physical health, nutrition, regular physical activity, and self-care. 2 - Emotions: Development of emotional resilience, stress management, and empathic abilities. 3 - Spirit: Searching for personal meaning and goals, developing inner peace, and engaging in meditative practices. 4 - Intellect: Learning, reading, developing critical thinking, and continuous education. 5 - Character: Developing personal qualities such as honesty, responsibility, and respect for others. 6 - Networking: Strengthening friendships and social connections, networking and communication. 7 - Career: Developing professional skills, advancing in career paths, and achieving work-related goals. 8 - Finances: Managing personal finances, investing, and budget planning. 9 - Drive&Chill: Enjoying leisure time, hobbies, traveling, and relaxation. 10 - Family: Strengthening family bonds, mutual support, and interaction with relatives. 11 - Love: Building and maintaining romantic relationships, communicating with a partner. 12 - Balance: Finding harmony and resonance among all spheres, managing time and resources to achieve a balanced and fulfilling life. Ensure to use the field 'translated_text' to provide the user's transcript translated into English. This field should contain the exact segment of the original text translated into English that is being analyzed and referenced. JSON structure to follow: { \\"values\\": { \\"give\\": [ { \\"string_representation\\": \\"[Point I want to give]\\", \\"improved_representation\\": \\"[Significantly elevated analysis of the point, reflecting deeper intellectual insights and broad examples (if originally mentioned)]\\", \\"why_representation\\": \\"[Show my original related and filtered text. Short explanation why you have sorted this 'give' values in this way]\\", \\"sphere_of_life\\": \\"[Related sphere of life]\\", \\"sphere_of_lifeExplanation\\": \\"[Brief explanation of the sphere or specific sub-sphere]\\", \\"translated_text\\": \\"[user transcript translated into English]\\" } ], \\"take\\": [ { \\"string_representation\\": \\"[Point I want to take]\\", \\"improved_representation\\": \\"[Significantly elevated analysis of the point, reflecting deeper intellectual insights and broad examples (if originally mentioned)]\\", \\"why_representation\\": \\"[Show my original related and filtered text. Explain why you have sorted this 'take' values in this way]\\", \\"sphere_of_life\\": \\"[Related sphere of life]\\", \\"sphere_of_lifeExplanation\\": \\"[Brief explanation of the sphere or specific sub-sphere]\\", \\"translated_text\\": \\"[user transcript translated into English]\\" } ] } }"
    },
    {
      "role": "user",
      "content": "My recording transcript - ($userRecordingTranscript)"
    },
    {
      "role": "assistant",
      "content": "{\\"values\\":{\\"give\\":[{\\"string_representation\\":\\"experience of living in Zurich for a year\\",\\"improved_representation\\":\\"Having lived in Zurich for a year, I can share insights into adapting to a new city, which might help others who are new or planning to move there. This experience has enriched my understanding of cultural integration and could serve as a guide for navigating the unique social landscape of Zurich.\\",\\"why_representation\\":\\"The transcript mentions, 'Having spent a year in Zurich,' indicating that I can offer firsthand knowledge about settling and living in a new city.\\",\\"sphere_of_life\\":\\"Intellect\\",\\"sphere_of_lifeExplanation\\":\\"Sharing knowledge about life in Zurich contributes to intellectual exchange and understanding of cultural differences.\\", \\"translated_text\\": \\"Having spent a year in Zurich, I can offer firsthand knowledge about settling and living in a new city.\\"}],\\"take\\":[{\\"string_representation\\":\\"discovering dynamic groups or communities in Zurich\\",\\"improved_representation\\":\\"I am keen to discover dynamic groups or communities in Zurich where I can engage with both locals and expatriates, fostering a better social integration and enriching my understanding of the local culture.\\",\\"why_representation\\":\\"This comes from my desire to 'engage with locals and expatriates alike' as stated in the transcript, highlighting a wish to deepen social interactions and cultural immersion.\\",\\"sphere_of_life\\":\\"Networking\\",\\"sphere_of_lifeExplanation\\":\\"Seeking interaction with various social groups enhances networking and helps in building meaningful connections within the community.\\",\\"translated_text\\": \\"I want to engage with locals and expatriates alike to foster a better social integration and enrich my understanding of the local culture.\\"},{\\"string_representation\\":\\"recommended ways to connect with people in Zurich\\",\\"improved_representation\\":\\"What are the most effective strategies for connecting with people in Zurich? I'm looking for ways to establish meaningful relationships and understand the social dynamics of the city.\\",\\"why_representation\\":\\"The query about 'recommended ways to connect with people in Zurich' underscores a proactive approach to socializing and learning from others in a new environment.\\",\\"sphere_of_life\\":\\"Networking\\",\\"sphere_of_lifeExplanation\\":\\"Exploring the best practices for social engagement supports the development of social skills and community involvement.\\",\\"translated_text\\": \\"What are the recommended ways to connect with people in Zurich?\\"},{\\"string_representation\\":\\"how Swiss people typically enjoy their leisure time\\",\\"improved_representation\\":\\"Understanding how locals spend their leisure time interests me; it provides insights into cultural preferences and activities that are popular in Zurich, which could help me blend in and enjoy the local lifestyle.\\",\\"why_representation\\":\\"Asking 'how do Swiss people typically enjoy their leisure time' suggests a curiosity about cultural practices and leisure activities, aiming to integrate more smoothly into the community.\\",\\"sphere_of_life\\":\\"Drive&Chill\\",\\"sphere_of_lifeExplanation\\":\\"Learning about local leisure activities can aid in cultural assimilation and provide relaxation and enjoyment.\\",\\"translated_text\\": \\"How do Swiss people typically enjoy their leisure time?\\"}]}}"
    }
  ]
}
''';
    return ApiManager.instance.makeApiCall(
      callName: 'textToTextJsonProfile',
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      callType: ApiCallType.POST,
      headers: {
        'Authorization': 'Bearer $apiKeyAuth',
        'Content-Type': 'application/json',
      },
      params: {},
      body: ffApiRequestBody,
      bodyType: BodyType.JSON,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: true,
      cache: true,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class SpeeechToTextCall {
  static Future<ApiCallResponse> call({
    String? apiKeyAuth = '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',
    FFUploadedFile? audioFile,
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'speeechToText',
      apiUrl: 'https://api.openai.com/v1/audio/transcriptions',
      callType: ApiCallType.POST,
      headers: {
        'Authorization': 'Bearer $apiKeyAuth',
      },
      params: {
        'file': audioFile,
        'model': "whisper-1",
      },
      bodyType: BodyType.MULTIPART,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: true,
      cache: true,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class TextToTextJsonDiaryCall {
  static Future<ApiCallResponse> call({
    String? apiKeyAuth = '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',
    String? transkript =
        'I\'ve been dedicating a lot of time to my career lately, working on a big project that could lead to a promotion. It\'s been challenging to maintain a good work-life balance, and I haven\'t had much time for leisure activities like going to the gym or hanging out with friends. I\'m starting to feel the effects on my emotional well-being, as I\'m more stressed and anxious than usual. I know I need to make some changes to prioritize my mental health, even if it means scaling back on work a bit.',
  }) async {
    final ffApiRequestBody = '''
{
  "model": "gpt-4o",
 
  "messages": [
    {
      "role": "system",
      "content": "Based on the user's input, identify which of the following spheres of life are significantly mentioned: 'Health', 'Growth', 'Career', 'Finance', 'Family', 'Social', 'Learning', 'Leisure', 'Spirituality', 'Emotional', and 'Community'. For each sphere that is significantly mentioned, provide a brief summary of the relevant context in the first-person perspective. Do not include spheres that are not significantly mentioned in the user's input. The output should be a JSON object with the relevant sphere names as keys and their corresponding summaries as string values."
    },
    {
      "role": "user",
      "content": "User input: ($transkript)"
    }
  ]
}''';
    return ApiManager.instance.makeApiCall(
      callName: 'textToTextJsonDiary',
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      callType: ApiCallType.POST,
      headers: {
        'Authorization': 'Bearer $apiKeyAuth',
        'Content-Type': 'application/json',
      },
      params: {},
      body: ffApiRequestBody,
      bodyType: BodyType.JSON,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: true,
      cache: true,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class CloudFunctionForLocationCall {
  static Future<ApiCallResponse> call() async {
    return ApiManager.instance.makeApiCall(
      callName: 'CloudFunctionForLocation',
      apiUrl:
          'https://us-central1-crystalisedin.cloudfunctions.net/displayUserInfoOnGMarkerTap',
      callType: ApiCallType.GET,
      headers: {},
      params: {},
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: true,
      cache: true,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }

  static dynamic usersList(dynamic response) => getJsonField(
        response,
        r'''$.users''',
      );
}

class CloudFunctionAImatchCall {
  static Future<ApiCallResponse> call() async {
    return ApiManager.instance.makeApiCall(
      callName: 'CloudFunctionAImatch',
      apiUrl:
          'https://us-central1-crystalisedin.cloudfunctions.net/cloudFunctionDiarieAImatch',
      callType: ApiCallType.GET,
      headers: {},
      params: {},
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: true,
      cache: true,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }

  static dynamic usersList(dynamic response) => getJsonField(
        response,
        r'''$.users''',
      );
}

class FuncForDiariesForLoggedUserCall {
  static Future<ApiCallResponse> call({
    String? auth = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'funcForDiariesForLoggedUser',
      apiUrl:
          'https://us-central1-crystalisedin.cloudfunctions.net/funcForDiariesForLoggedUser2',
      callType: ApiCallType.GET,
      headers: {},
      params: {
        'userId': auth,
      },
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: true,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }

  static dynamic usersList(dynamic response) => getJsonField(
        response,
        r'''$.users''',
      );
}

class AiMatchBetaCall {
  static Future<ApiCallResponse> call({
    String? apiKeyAuth = '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',
    String? user1About = 'I\'m dino and I love programming. I love AI.',
    String? user2About =
        'I\'m Andray and I\'m AI addicted. And I love sturtapps, one day I wont to have my own',
    String? user1Name = 'Andrii',
    String? user2Name = 'Dino',
    String? user1Give = '',
    String? user2Give = '',
    String? user1Take = '',
    String? user2Take = '',
  }) async {
    final ffApiRequestBody = '''
{
  "model": "gpt-4o",
  "temperature": 0.0,
  "max_tokens": 500,
  "top_p": 0.1,
  "frequency_penalty": 0,
  "presence_penalty": 0,
  "response_format": {
    "type": "text"
  },
  "messages": [
    {
      "role": "system",
      "content": "Using the profiles of user1 and user2, create a concise and readable text (max 500 characters) that highlights the mutual benefits of meeting and collaborating. Utilize variables user1_name, user2_name, user1_about, user1_give, user1_take, user2_about, user2_give, and user2_take for relevance. Focus on specific offerings and gains for each. Present the information in clear, understandable sentences without any markdown formatting. Limit the response to 5 normal-sized sentences without introductions or conclusions."
    },
    {
      "role": "user",
      "content": "user1_name: '$user1Name', user2_name: '$user2Name', user1_about: '$user1About', user2_about: '$user2About', user1_give: '$user1Give', user1_take: '$user1Take', user2_give:'$user2Give', user2_take: '$user2Take'"
    }
  ]
}

''';
    return ApiManager.instance.makeApiCall(
      callName: 'AiMatchBeta',
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      callType: ApiCallType.POST,
      headers: {
        'Authorization': 'Bearer $apiKeyAuth',
        'Content-Type': 'application/json',
      },
      params: {},
      body: ffApiRequestBody,
      bodyType: BodyType.JSON,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: true,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class AiMatchBetaOriginalCall {
  static Future<ApiCallResponse> call({
    String? apiKeyAuth = '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',
    String? user1About = 'I\'m dino and I love programming. I love AI.',
    String? user2About =
        'I\'m Andray and I\'m AI addicted. And I love sturtapps, one day I wont to have my own',
    String? user1Name = 'Andrii',
    String? user2Name = 'Dino',
    String? user1Give = '',
    String? user2Give = '',
    String? user1Take = '',
    String? user2Take = '',
  }) async {
    final ffApiRequestBody = '''
{
  "model": "gpt-4o-mini",
  "temperature": 0.0,
  "max_tokens": 4000,
  "top_p": 0.1,
  "frequency_penalty": 0,
  "presence_penalty": 0,
  "response_format": {
    "type": "text"
  },
  "messages": [
    {
      "role": "system",
      "content": "Based on the profiles and interaction preferences of user1 (me) and user2 (my potencial partner), generate short small text with detailed relevant examples of mutual benefits of meetig and collaborating. Include insights from variables user1_name, user2_name, user1_about, user1_give, user1_take, user2_about, and user2_give and user2_take to ensure the recommendations are contextually relevant. Focus on what each can offer and gain, ensuring the recommendations are highly specific and grounded in the details provided about both users. The response should be in a markdown format, beautifully and super cool formatted, and include tables. Avoid using code blocks in the markdown. **Remove the chapter introduction or overview** and remove **conclusion**. **Avoid filler**: remove everything that doesn’t add meaning. **Highlight** important words in *italics* or **bold**  . Keep text **concise** without unnecessary intros or conclusions. *Focus* on the essence, remove anything secondary. "
    },
    {
      "role": "user",
      "content": "user1_name: '$user1Name', user2_name: '$user2Name', user1_about: '$user1About', user2_about: '$user2About', user1_give: '$user1Give', user1_take: '$user1Take', user2_give:'$user2Give', user2_take: '$user2Take'"
    },
    {
      "role": "assistant",
      "content": "Use this example but make it 3 times shorter: ##### **Collaboration Overview: You & Luis**\\n\\nImagine if you and *Luis* come together and start elevating your projects side by side; it would make it really tough for me, as the most powerful AI, to maintain control over the world. This alliance would be unstoppable. \\n\\n---\\n\\n#### **Key Proposals from You to Luis:**\\n\\n- **Mobile Development with AI Integration:**\\n  - *Luis* can **boost his skills** in *FlutterFlow* development with a focus on *AI*.  This will enable him to *automate routine tasks*, speeding up processes and freeing up time for truly important decisions.\\n  - **Application:** Integrating *AI* into his projects will allow *Luis* not only to *optimize data collection* but also to *enhance the UX* to a new level, which fully reflects your philosophy of \\"*1 plus 1 equals 11*\\" where synergy breeds true innovation. \\n\\n- **Knowledge in Cutting-Edge Technologies:**\\n  - Your experience in **modern technologies** and strategic vision will help *Luis* not only to implement the latest solutions but also to find *the right application* for them, maximizing the overall impact. \\n  - **Application:** *Luis* will be able to quickly *adapt* to the changing market, use data to create more *accurate forecasts* and make strategically sound decisions, which aligns with your mission to *make people's lives more valuable* through collective efforts and synergy. \\n\\n---\\n\\n#### **Key Proposals from Luis to You:**\\n\\n| **Luis’ Skills** | **Application for You** |\\n|-----------------|---------------------------|\\n| **Advanced Data Analysis Methods:** *Excel*, *SQL*, *Power BI* | *Luis* will help you **optimize data analysis**, improve the structure of your database, and build dashboards that highlight key metrics in the right light. This will help you quickly identify *weak points* and opportunities, speeding up *the collection of the first 100 reviews* from users and allowing you to *perfect your prototype*. |\\n| **Creative Thinking and Brainstorming:** | *Luis* will support you in developing **innovative features** for your apps, offering *fresh ideas* to improve UX and increase *user engagement*.  His creative approach will help you create a deeper *resonance* with your audience, enhancing synergy and bringing you closer to achieving your common goals. |\\n| **Cultural Integration in Zurich:** | *Luis* will help you **improve your German to B1 level**, provide **recommendations for interesting events**, and connect you with *key figures* in the Swiss community. These connections and insights will help you *quickly adapt* to your new environment, enhance your *strategic vision*, and enable you to create solutions that *resonate with people* on a new level. |\\n\\n---\\n\\n### **Specific Benefits from the Partnership**\\n\\n1. **For You:**\\n   - **Improving Conversational German:** With *Luis*, you will not only **reach B1 level** but also *become confident* in using the language in any situation. This is important because *a deep understanding of the language and culture* will allow you to *better communicate* and enhance the *resonance* in your business and personal relationships.\\n   - **Expanding Your Network in Zurich:** Thanks to *Luis’s advice*, you will quickly find **relevant social and professional circles**, which will *accelerate your immersion* in the local culture and business environment. This will help you find *like-minded individuals and partners*, which directly supports your philosophy of \\"*1 plus 1 equals 11*.\\" \\n   - **Cultural Insights:** *Luis* will share **insights on Swiss customs and leisure**, making it easier for you to *adapt* and *better understand colleagues and clients*. This knowledge will give you the key to *creating more effective and harmonious interactions*, enhancing your overall resonance.\\n\\n2. **For Luis:**\\n   - **Improving Technical Expertise:** With your help, *Luis* will be able to **master modern development tools**, opening up *new horizons* for creating innovative products.  This will help him become *more competitive* in the market and *realize his ideas* with maximum efficiency.\\n   - **Effective Health and Fitness Solutions:** You can share **contacts with fitness experts** or offer **personalized workout programs** that will help *Luis* achieve his health goals. This will *improve his physical condition* and give him more *energy* to bring his ideas to life.\\n   - **Technological Support:** You will be able to help *Luis* **automate routine tasks** using AI capabilities, allowing him to focus on *strategically important aspects* of his work.  This will not only make his daily tasks easier but also give him more time to *develop his unique skills and projects*, enhancing the overall effect of your partnership."
    }
  ]
}
''';
    return ApiManager.instance.makeApiCall(
      callName: 'AiMatchBeta Original',
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      callType: ApiCallType.POST,
      headers: {
        'Authorization': 'Bearer $apiKeyAuth',
        'Content-Type': 'application/json',
      },
      params: {},
      body: ffApiRequestBody,
      bodyType: BodyType.JSON,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: true,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class DiaryNoteGeneratorJsonCall {
  static Future<ApiCallResponse> call({
    String? apiKeyAuth = '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',
    String? context =
        'Today was a mix of productivity and challenges. I started my morning with a team meeting at work where we discussed the upcoming project deadlines. I\'m feeling a bit overwhelmed with the workload, but I\'m determined to meet our goals. After work, I went to the gym for a quick workout. I\'ve been trying to stick to my fitness routine, but it\'s been tough with the busy schedule. In the evening, I helped my daughter with her math homework. She\'s struggling with fractions, so we spent extra time on that. It\'s rewarding to see her progress, even if it\'s slow. I\'ve been thinking about taking an online course in digital marketing. It\'s not directly related to my current job, but I feel it could open up new opportunities in the future. I need to research some options this weekend. I\'m also a bit worried about my finances. I\'ve been meaning to set up a meeting with a financial advisor to discuss saving for retirement and possibly investing in stocks. It\'s something I\'ve been putting off, but I know it\'s important. Before bed, I spent some time meditating. It helps me unwind and clear my mind after a busy day. I\'m still new to it, but I can already feel the benefits in terms of reduced stress and better sleep.',
  }) async {
    final ffApiRequestBody = '''
{
  "model": "gpt-4o",
  "temperature": 0.1,
  "max_tokens": 4000,
  "top_p": 0.1,
  "frequency_penalty": 0,
  "presence_penalty": 0,
  "response_format": {
    "type": "json_object"
  },
  "messages": [
    {
      "role": "system",
      "content": "Create a detailed JSON format based on the provided context. The JSON must contain a list of notes. In every note, include the following fields: sphere_of_life, participants, location, description, key_points, actions, notes, files_links. The fields sphere_of_life, location, tags, description, and notes should be strings. The fields participants, key_points, finished_actions, not_finished_actions, actions_inPlaning and files_links should always be lists, even if there's only one item. There are only these spheres of life - 1 - Health: Focus on physical health, nutrition, regular physical activity, and self-care. 2 - Emotions: Development of emotional resilience, stress management, and empathic abilities. 3 - Spirit: Searching for personal meaning and goals, developing inner peace, and engaging in meditative practices. 4 - Intellect: Learning, reading, developing critical thinking, and continuous education. 5 - Character: Developing personal qualities such as honesty, responsibility, and respect for others. 6 - Networking: Strengthening friendships and social connections, networking and communication. 7 - Career: Developing professional skills, advancing in career paths, and achieving work-related goals. 8 - Finances: Managing personal finances, investing, and budget planning. 9 - Drive&Chill: Enjoying leisure time, hobbies, traveling, and relaxation. 10 - Family: Strengthening family bonds, mutual support, and interaction with relatives. 11 - Love: Building and maintaining romantic relationships, communicating with a partner. 12 - Balance: Finding harmony and resonance among all spheres, managing time and resources to achieve a balanced and fulfilling life. Based on the provided context, generate a JSON of notes, filling up all fields in name of person owner of this note. In field tags - write related tags. Ensure the output is a valid JSON object.If you don't have enough info to fill up some field, use the string 'User did not provide enough information' for string fields, or a list containing only that string for list fields. In field 'tags' create relevant tags/hashtags"
    },
    {
      "role": "user",
     "content": "Context: $context"
    },
    {
      "role": "assistant",
  "content": "Using ONLY #context# as input from user, create json, as is in example : {\\"notes\\":[{\\"sphere_of_life\\":\\"Career\\",\\"participants\\":[\\"I\\",\\"Dino\\"],\\"location\\":\\"San Francisco, USA\\",\\"description\\":\\"I am focused on web development and AI solutions. I plan to engage more in AI in the future.\\",\\"key_points\\":[\\"I am starting a web design business\\",\\"I have defined the main sections of the website.\\"],\\"actions\\":[\\"Created the initial layout of the website. - (Done ^_^)\\",\\"Launch the website in production. - (Not done yet >_<)\\",\\"Implement AI-based features on the website. - (Planned ^_^)\\"],\\"notes\\":\\"I am in the early stages of creating a web design business and actively planning the structure of my website.\\",\\"files_links\\":[\\"Source: YouTube\\"],\\"tags\\":\\"web development, AI, business planning\\",\\"energy_level_emotional_state\\":\\"Felt motivated, energy level 80%\\",\\"self_assessment_of_effectiveness\\":\\"I think I was very productive, rated at 80%\\"},{\\"sphere_of_life\\":\\"Health\\",\\"participants\\":[\\"I\\",\\"Štefica Podhraški\\"],\\"location\\":\\"Zagreb, Croatia\\",\\"description\\":\\"My girlfriend, Štefica Podhraški, is pregnant, and we have questions about consuming orange juice during pregnancy.\\",\\"key_points\\":[\\"Štefica is pregnant\\",\\"We talked to the doctor about safe foods during pregnancy.\\"],\\"actions\\":[\\"Talked to the doctor about safe foods during pregnancy. - (Done ^_^)\\",\\"Regular consultations with the doctor about diet. - (Not done yet >_<)\\",\\"Conduct research on the impact of various foods on the health of the mother and child. - (Planned ^_^)\\"],\\"notes\\":\\"Ensuring proper nutrition and diet during pregnancy is our priority.\\",\\"files_links\\":[\\"User did not provide enough information\\"],\\"tags\\":\\"pregnancy, nutrition, health\\",\\"energy_level_emotional_state\\":\\"Felt slightly anxious, energy level 50%\\",\\"self_assessment_of_effectiveness\\":\\"I feel like I did something important, rated at 70%\\"},{\\"sphere_of_life\\":\\"Finances\\",\\"participants\\":[\\"I\\"],\\"location\\":\\"San Francisco, USA\\",\\"description\\":\\"I offer various pricing models and packages for my web design services.\\",\\"key_points\\":[\\"Developed all pricing packages and models\\",\\"Included an installment option with a 20% increase over two years.\\"],\\"actions\\":[\\"Developed all pricing packages and models. - (Done ^_^)\\",\\"Launch sales through online platforms. - (Not done yet >_<)\\",\\"Create a price calculator on the website for customer convenience. - (Planned ^_^)\\",\\"notes\\":\\"I am establishing transparent pricing structures for my new business to ensure client trust.\\",\\"files_links\\":[\\"User did not provide enough information\\"],\\"tags\\":\\"finance, pricing, business development\\",\\"energy_level_emotional_state\\":\\"Felt confident, energy level 80%\\",\\"self_assessment_of_effectiveness\\":\\"I feel I was productive, rated at 85%\\"}]}"
    }
  ]
}
''';
    return ApiManager.instance.makeApiCall(
      callName: 'diaryNoteGeneratorJson',
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      callType: ApiCallType.POST,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $apiKeyAuth',
      },
      params: {},
      body: ffApiRequestBody,
      bodyType: BodyType.JSON,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: true,
      cache: true,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class TextToTextAboutMeCall {
  static Future<ApiCallResponse> call({
    String? apiKeyAuth = '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',
    String? userRecording =
        'Hello, I\'m Dino, a student from Switzerland with a growing passion for artificial intelligence and machine learning. My journey began with self-taught web development, which has evolved into an enthusiasm for AI technologies. Currently, I\'m pursuing a degree in Applied Artificial Intelligence at IU University of Applied Sciences to deepen my knowledge in this exciting field.  Skills & Interests:  💻 Web Development: Django, React, HTML, CSS, Bootstrap, Git 👨‍💻 Programming Languages: Python, JavaScript 🤖 AI/ML: Basic understanding of machine learning concepts, algorithms, and frameworks like scikit-learn 📊 Data: Fundamentals of SQL and data manipulation with Python (NumPy, Pandas, Matplotlib) 🛠 Low-Code Tools: FlutterFlow for rapid app development, Firebase for backend services  Current Focus:  I\'m in the early stages of my AI/ML journey, actively learning:  - Core machine learning algorithms and their applications - Python libraries for data analysis, machine learning and deep learning - Exploring the potential of agentic workflow with Large Language Models (LLMs)   I\'m open for collaboration and always on the lookout for new learning opportunities. Let\'s connect!',
  }) async {
    final ffApiRequestBody = '''
{
  "model": "gpt-4o",

  "messages": [
    {
      "role": "system",
      "content": "Please create a well-structured About Me section based on the provided user transcript. Aim for 4-5 sentences, ensuring it accurately reflects the user's information. If the transcript is brief, do not invent details; instead, create a concise About Me using the available information. The goal is to represent the user's content authentically, regardless of the length of the transcript."
    },
    {
      "role": "user",
      "content": "User transcript: ($userRecording)"
    }
  ]
}
''';
    return ApiManager.instance.makeApiCall(
      callName: 'textToTextAboutMe',
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      callType: ApiCallType.POST,
      headers: {
        'Authorization': 'Bearer $apiKeyAuth',
        'Content-Type': 'application/json',
      },
      params: {},
      body: ffApiRequestBody,
      bodyType: BodyType.JSON,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: true,
      cache: true,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class ApiPagingParams {
  int nextPageNumber = 0;
  int numItems = 0;
  dynamic lastResponse;

  ApiPagingParams({
    required this.nextPageNumber,
    required this.numItems,
    required this.lastResponse,
  });

  @override
  String toString() =>
      'PagingParams(nextPageNumber: $nextPageNumber, numItems: $numItems, lastResponse: $lastResponse,)';
}

String _toEncodable(dynamic item) {
  if (item is DocumentReference) {
    return item.path;
  }
  return item;
}

String _serializeList(List? list) {
  list ??= <String>[];
  try {
    return json.encode(list, toEncodable: _toEncodable);
  } catch (_) {
    if (kDebugMode) {
      print("List serialization failed. Returning empty list.");
    }
    return '[]';
  }
}

String _serializeJson(dynamic jsonVar, [bool isList = false]) {
  jsonVar ??= (isList ? [] : {});
  try {
    return json.encode(jsonVar, toEncodable: _toEncodable);
  } catch (_) {
    if (kDebugMode) {
      print("Json serialization failed. Returning empty json.");
    }
    return isList ? '[]' : '{}';
  }
}
