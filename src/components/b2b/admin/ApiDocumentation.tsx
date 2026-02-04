import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Book, 
  Code, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronRight,
  Lock,
  Users,
  ClipboardList,
  Webhook,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ApiDocumentationProps {
  companyId: string;
}

export default function ApiDocumentation({ companyId }: ApiDocumentationProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    authentication: true,
    users: false,
    assessments: false,
    webhooks: false,
  });

  const copyToClipboard = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const CodeBlock = ({ code, language = 'bash', id }: { code: string; language?: string; id: string }) => (
    <div className="relative group">
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 hover:bg-slate-700"
        onClick={() => copyToClipboard(code, id)}
      >
        {copiedCode === id ? (
          <Check className="h-4 w-4 text-green-400" />
        ) : (
          <Copy className="h-4 w-4 text-slate-300" />
        )}
      </Button>
    </div>
  );

  const baseUrl = 'https://api.rolecolorfinder.com/v1';

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Book className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">API Documentation</CardTitle>
              <CardDescription className="mt-1">
                Complete reference for integrating with the Role Color Finder API. 
                Use your API keys to authenticate requests and access your company data programmatically.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Start */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            Quick Start
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Make your first API request in seconds. Replace <code className="bg-muted px-1.5 py-0.5 rounded text-xs">YOUR_API_KEY</code> with your actual API key.
          </p>
          <CodeBlock
            id="quickstart"
            code={`curl -X GET "${baseUrl}/users" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
          />
        </CardContent>
      </Card>

      {/* Main Documentation */}
      <Tabs defaultValue="rest" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="rest">REST API</TabsTrigger>
          <TabsTrigger value="examples">Code Examples</TabsTrigger>
          <TabsTrigger value="errors">Error Handling</TabsTrigger>
        </TabsList>

        <TabsContent value="rest" className="space-y-4">
          {/* Authentication Section */}
          <Collapsible open={openSections.authentication} onOpenChange={() => toggleSection('authentication')}>
            <Card className="border-0 shadow-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Authentication
                    </CardTitle>
                    {openSections.authentication ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4 pt-0">
                  <p className="text-sm text-muted-foreground">
                    All API requests require authentication using your API key. Include the key in the 
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs mx-1">Authorization</code> header.
                  </p>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Header Format</h4>
                    <CodeBlock
                      id="auth-header"
                      code={`Authorization: Bearer rcf_YOUR_API_KEY`}
                    />
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Alternative: X-API-Key Header</h4>
                    <CodeBlock
                      id="auth-xapi"
                      code={`X-API-Key: rcf_YOUR_API_KEY`}
                    />
                  </div>

                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-700 dark:text-yellow-500">Security Notice</p>
                        <p className="text-muted-foreground">
                          Never expose your API key in client-side code. Always make API calls from a secure server.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Users Endpoints */}
          <Collapsible open={openSections.users} onOpenChange={() => toggleSection('users')}>
            <Card className="border-0 shadow-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Users
                      <Badge variant="secondary" className="ml-2 text-xs">5 endpoints</Badge>
                    </CardTitle>
                    {openSections.users ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6 pt-0">
                  {/* List Users */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-600 hover:bg-green-600">GET</Badge>
                      <code className="text-sm">/users</code>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Retrieve a list of all users in your company.
                    </p>
                    <CodeBlock
                      id="list-users"
                      code={`curl -X GET "${baseUrl}/users" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                    />
                    <div className="text-sm">
                      <p className="font-medium mb-2">Response</p>
                      <CodeBlock
                        id="list-users-response"
                        code={`{
  "data": [
    {
      "id": "user_123",
      "email": "john@example.com",
      "full_name": "John Doe",
      "role": "employee",
      "status": "completed",
      "assessment_completed_at": "2024-01-15T10:30:00Z",
      "role_color": "green"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 50
}`}
                      />
                    </div>
                  </div>

                  <hr className="border-border" />

                  {/* Get Single User */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-600 hover:bg-green-600">GET</Badge>
                      <code className="text-sm">/users/:id</code>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Retrieve details for a specific user.
                    </p>
                    <CodeBlock
                      id="get-user"
                      code={`curl -X GET "${baseUrl}/users/user_123" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                    />
                  </div>

                  <hr className="border-border" />

                  {/* Invite User */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-600 hover:bg-blue-600">POST</Badge>
                      <code className="text-sm">/users/invite</code>
                      <Badge variant="outline" className="text-xs">write</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Invite a new user to your company portal. Requires <code className="bg-muted px-1 rounded text-xs">write</code> permission.
                    </p>
                    <CodeBlock
                      id="invite-user"
                      code={`curl -X POST "${baseUrl}/users/invite" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "jane@example.com",
    "full_name": "Jane Smith",
    "job_role": "Engineer",
    "send_email": true
  }'`}
                    />
                  </div>

                  <hr className="border-border" />

                  {/* Update User */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-600 hover:bg-yellow-600">PATCH</Badge>
                      <code className="text-sm">/users/:id</code>
                      <Badge variant="outline" className="text-xs">write</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Update user information.
                    </p>
                    <CodeBlock
                      id="update-user"
                      code={`curl -X PATCH "${baseUrl}/users/user_123" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "job_role": "Senior Engineer",
    "skills": ["JavaScript", "React", "Node.js"]
  }'`}
                    />
                  </div>

                  <hr className="border-border" />

                  {/* Delete User */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-600 hover:bg-red-600">DELETE</Badge>
                      <code className="text-sm">/users/:id</code>
                      <Badge variant="outline" className="text-xs">delete</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Remove a user from your company. Requires <code className="bg-muted px-1 rounded text-xs">delete</code> permission.
                    </p>
                    <CodeBlock
                      id="delete-user"
                      code={`curl -X DELETE "${baseUrl}/users/user_123" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Assessments Endpoints */}
          <Collapsible open={openSections.assessments} onOpenChange={() => toggleSection('assessments')}>
            <Card className="border-0 shadow-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      Assessments
                      <Badge variant="secondary" className="ml-2 text-xs">3 endpoints</Badge>
                    </CardTitle>
                    {openSections.assessments ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6 pt-0">
                  {/* List Assessments */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-600 hover:bg-green-600">GET</Badge>
                      <code className="text-sm">/assessments</code>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Retrieve all completed assessments for your company.
                    </p>
                    <CodeBlock
                      id="list-assessments"
                      code={`curl -X GET "${baseUrl}/assessments" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                    />
                    <div className="text-sm">
                      <p className="font-medium mb-2">Query Parameters</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li><code className="bg-muted px-1 rounded text-xs">status</code> - Filter by status (completed, pending)</li>
                        <li><code className="bg-muted px-1 rounded text-xs">since</code> - ISO date to filter results after</li>
                        <li><code className="bg-muted px-1 rounded text-xs">limit</code> - Max results (default: 50, max: 100)</li>
                      </ul>
                    </div>
                  </div>

                  <hr className="border-border" />

                  {/* Get Assessment Results */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-600 hover:bg-green-600">GET</Badge>
                      <code className="text-sm">/assessments/:userId/results</code>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Get detailed assessment results for a specific user.
                    </p>
                    <CodeBlock
                      id="get-assessment"
                      code={`curl -X GET "${baseUrl}/assessments/user_123/results" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                    />
                    <div className="text-sm">
                      <p className="font-medium mb-2">Response</p>
                      <CodeBlock
                        id="assessment-response"
                        code={`{
  "user_id": "user_123",
  "completed_at": "2024-01-15T10:30:00Z",
  "role_color": "green",
  "scores": {
    "green": 85,
    "red": 42,
    "blue": 68,
    "yellow": 55
  },
  "strengths": [
    "Strategic thinking",
    "Team collaboration"
  ],
  "growth_areas": [
    "Risk tolerance",
    "Quick decision making"
  ]
}`}
                      />
                    </div>
                  </div>

                  <hr className="border-border" />

                  {/* Export Assessments */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-600 hover:bg-green-600">GET</Badge>
                      <code className="text-sm">/assessments/export</code>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Export all assessment data as CSV or JSON.
                    </p>
                    <CodeBlock
                      id="export-assessments"
                      code={`curl -X GET "${baseUrl}/assessments/export?format=csv" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -o assessments.csv`}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Webhooks */}
          <Collapsible open={openSections.webhooks} onOpenChange={() => toggleSection('webhooks')}>
            <Card className="border-0 shadow-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Webhook className="h-4 w-4" />
                      Webhooks
                      <Badge variant="outline" className="ml-2 text-xs">Coming Soon</Badge>
                    </CardTitle>
                    {openSections.webhooks ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    Webhook support is coming soon. You'll be able to receive real-time notifications when:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                    <li>A user completes their assessment</li>
                    <li>A new user is invited</li>
                    <li>Assessment results are updated</li>
                  </ul>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">JavaScript / Node.js</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeBlock
                id="js-example"
                code={`// Using fetch
const API_KEY = 'rcf_YOUR_API_KEY';
const BASE_URL = '${baseUrl}';

async function getUsers() {
  const response = await fetch(\`\${BASE_URL}/users\`, {
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(\`API error: \${response.status}\`);
  }
  
  return response.json();
}

async function inviteUser(email, fullName) {
  const response = await fetch(\`\${BASE_URL}/users/invite\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      full_name: fullName,
      send_email: true
    })
  });
  
  return response.json();
}`}
              />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Python</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeBlock
                id="python-example"
                code={`import requests

API_KEY = 'rcf_YOUR_API_KEY'
BASE_URL = '${baseUrl}'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

# Get all users
def get_users():
    response = requests.get(f'{BASE_URL}/users', headers=headers)
    response.raise_for_status()
    return response.json()

# Invite a new user
def invite_user(email, full_name):
    data = {
        'email': email,
        'full_name': full_name,
        'send_email': True
    }
    response = requests.post(
        f'{BASE_URL}/users/invite',
        headers=headers,
        json=data
    )
    response.raise_for_status()
    return response.json()

# Get assessment results
def get_assessment_results(user_id):
    response = requests.get(
        f'{BASE_URL}/assessments/{user_id}/results',
        headers=headers
    )
    response.raise_for_status()
    return response.json()`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Error Responses</CardTitle>
              <CardDescription>
                The API uses standard HTTP status codes to indicate success or failure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Badge variant="destructive">401</Badge>
                    <div>
                      <p className="font-medium text-sm">Unauthorized</p>
                      <p className="text-sm text-muted-foreground">Invalid or missing API key</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Badge variant="destructive">403</Badge>
                    <div>
                      <p className="font-medium text-sm">Forbidden</p>
                      <p className="text-sm text-muted-foreground">API key lacks required permissions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Badge variant="destructive">404</Badge>
                    <div>
                      <p className="font-medium text-sm">Not Found</p>
                      <p className="text-sm text-muted-foreground">Resource doesn't exist</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Badge variant="destructive">429</Badge>
                    <div>
                      <p className="font-medium text-sm">Too Many Requests</p>
                      <p className="text-sm text-muted-foreground">Rate limit exceeded (100 requests/minute)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Badge variant="destructive">500</Badge>
                    <div>
                      <p className="font-medium text-sm">Internal Server Error</p>
                      <p className="text-sm text-muted-foreground">Something went wrong on our end</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="font-medium text-sm mb-2">Error Response Format</p>
                  <CodeBlock
                    id="error-format"
                    code={`{
  "error": {
    "code": "unauthorized",
    "message": "Invalid API key provided",
    "status": 401
  }
}`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Rate Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                API requests are rate limited to ensure fair usage and system stability.
              </p>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span>Standard limit</span>
                  <span className="font-mono">100 requests/minute</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span>Burst limit</span>
                  <span className="font-mono">10 requests/second</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Rate limit headers are included in every response:
              </p>
              <CodeBlock
                id="rate-limit-headers"
                code={`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200`}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
