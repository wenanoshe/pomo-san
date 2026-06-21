As a** user, **I want** to add time to the running focus countdown with a single click, **so that's to\*\* extend my focus session when I need more time to complete my task.

**Acceptance criteria**

```gherkin
Scenario: Add time to running focus countdown
   Given the focus countdown is running
   When I click the "+" button next to the countdown
   Then the focus countdown should increase by the configured amount of time

Scenario: Add time button visible during countdown
   Given the focus countdown is running
   Then I should see a "+" outline icon button to the right of the countdown
```

---

**As a** user, **I want** to configure the amount of time that gets added to the focus countdown, **so that's to** customize how much extra time I can add with each click.

**Acceptance criteria**

```gherkin
Scenario: Set custom add-time duration in config modal
   Given I have the config modal open
   When I enter a value in the "add time" input field
   Then the configured amount should be used when adding time to the countdown

Scenario: Default add-time duration is one minute
   Given I have not set a custom add-time duration
   When I open the config modal
   Then the default add-time value should be 1 minute

Scenario: Add-time setting persists across sessions
   Given I have set a custom add-time duration
   When I close and reopen the app
   Then my configured add-time duration should be retained

Scenario: No localStorage entry when add-time is unset
   Given I have not set a custom add-time duration
   Then no add-time value should be saved in local storage
```
