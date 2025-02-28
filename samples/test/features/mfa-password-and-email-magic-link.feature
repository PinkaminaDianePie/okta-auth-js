Feature: Multi-Factor Authentication with Password and Email Magic Link

  Background:
    Given the app has Email Verification callback uri defined
      And a Policy that defines "Authentication"
      And with a Policy Rule that defines "Password + Another Factor"
      And a user named "Mary"
      And she has an account with "active" state in the org

  Scenario: 2FA Login with Email Magic Link on the same browser
    When she clicks the "login" button
    Then she is redirected to the "Login" page
    When she has inserted her username
      And she has inserted her password
      And her password is correct
    When she submits the form
    Then she is redirected to the "Select Authenticator" page
    When she selects the "Email" factor
      And she submits the form
      And she clicks the Email magic link
    Then she is redirected to the "Root" page
      And she sees a table with her profile info
      And the cell for the value of "email" is shown and contains her "email"
