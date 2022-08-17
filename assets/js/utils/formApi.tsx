import type { EventForm, Links } from "../pages/Form";

export const checkEventForm = (eventForm: EventForm): boolean => {
  return eventForm.start_date != "" && eventForm.title != "";
};

export const sendEventForm = (
  eventForm: EventForm,
  setLinks: React.Dispatch<React.SetStateAction<Links | undefined>>
): void => {
  const csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content");

  fetch(`${window.location.origin}/webinars`, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-TOKEN": csrfToken ? csrfToken : "",
    },
    body: JSON.stringify({ webinar: eventForm }),
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      return Promise.reject(response.status);
    })
    .then((data) => {
      setLinks(data.webinar_links);
    })
    .catch(() => {
      alert("Something went wrong. Please try again in a moment.");
    });
};
