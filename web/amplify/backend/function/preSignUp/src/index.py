import json

ACCESS_KEY = 'custom:accessKey'
INVALID_ACCESS_KEY = 'Invalid access code'

def handler(event, context):
    # Auto confirm all emails
    # Note: Since all sign ups are protected by presenting the correct access phrase (see below code),
    # I don't really see a need to confirm user emails.
    event['response']['autoConfirmUser'] = True
    if 'email' in event['request']['userAttributes']:
        event['response']['autoVerifyEmail'] = True

    # Verify that user presented the correct access code
    if ACCESS_KEY in event['request']['userAttributes']:
        if event['request']['userAttributes'][ACCESS_KEY] != 'seattleite':
            raise Exception(INVALID_ACCESS_KEY)
    else: raise Exception(INVALID_ACCESS_KEY)
    return event
