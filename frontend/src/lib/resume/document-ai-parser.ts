import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { logger } from "@/lib/logger";

// Initialize the client.
let client: DocumentProcessorServiceClient;

if (process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64) {
  const credentialsJson = Buffer.from(process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64, 'base64').toString('utf8');
  const credentials = JSON.parse(credentialsJson);
  client = new DocumentProcessorServiceClient({ credentials });
} else {
  // Fallback to standard environment variables (GOOGLE_APPLICATION_CREDENTIALS)
  client = new DocumentProcessorServiceClient();
}

export async function parseWithDocumentAI(pdfBuffer: Buffer) {
  const projectId = process.env.GCP_PROJECT_ID;
  const location = process.env.GCP_DOCUMENT_AI_LOCATION || 'us';
  const processorId = process.env.GCP_DOCUMENT_AI_PROCESSOR_ID;

  if (!projectId || !processorId) {
    throw new Error('GCP Document AI is not fully configured (missing PROJECT_ID or PROCESSOR_ID).');
  }

  const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

  const request = {
    name,
    rawDocument: {
      content: pdfBuffer.toString('base64'),
      mimeType: 'application/pdf',
    },
  };

  // Recognize document
  const [result] = await client.processDocument(request);
  const { document } = result;

  if (!document) {
    throw new Error('Document AI returned an empty response.');
  }

  // Cost calculation log (estimate)
  const pageCount = document.pages?.length || 1;
  logger.info("[Document AI] Processed resume", { pageCount, estimatedCost: (pageCount * 0.05).toFixed(2) });

  // Simple mapping of entities if a Resume Processor is used.
  // We map what we can find into the profile JSON format.
  const profile: any = {
    full_name: "",
    email: "",
    phone: "",
    headline: "",
    about: "",
    city: "",
    country: "",
    skills: [],
    experience: [],
    education: [],
    projects: [],
    publications: []
  };

  if (document.entities) {
    for (const entity of document.entities) {
      const type = entity.type;
      const text = entity.mentionText || '';

      switch (type) {
        case 'person_name':
          if (!profile.full_name) profile.full_name = text;
          break;
        case 'email':
          if (!profile.email) profile.email = text;
          break;
        case 'phone':
          if (!profile.phone) profile.phone = text;
          break;
        case 'address':
        case 'location':
          if (!profile.city) profile.city = text;
          break;
        case 'skill':
          if (text) profile.skills.push(text);
          break;
        case 'experience':
        case 'employment':
          profile.experience.push({
            company: text,
            role: "Role",
            duration: "See resume",
            description: ""
          });
          break;
        case 'education':
          profile.education.push({
            institution: text,
            degree: "Degree",
            duration: ""
          });
          break;
      }
    }
  } else {
    // If we used a generic Form Parser, we might just grab the full text and fallback
    throw new Error('No structured entities found. Ensure you are using a Resume Processor.');
  }

  return profile;
}
