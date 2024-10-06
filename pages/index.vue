<template>
  <div>
    <h1>Get Toggl data</h1>
    <form novalidate @submit.prevent="login">
      <div>
        <label for="email">Email:</label>
        <input type="text" name="email" id="email" v-model="email"/>
      </div>
      <div>
        <label for="password">Password</label>
        <input type="password" name="password" id="password" v-model="password" />
      </div>
      <input type="submit" value="Login">
    </form>
    <div v-for="project in projects">
      <h2>{{ project.name}} <small>{{ project.id}}</small></h2>
      <table width="100%" border="1">
        <thead>
        <tr>
          <th>Description</th>
          <th width="10%">Monday</th>
          <th width="10%">Tuesday</th>
          <th width="10%">Wedsday</th>
          <th width="10%">Thursday</th>
          <th width="10%">Friday</th>
          <th width="10%">Saturday</th>
          <th width="10%">Sunday</th>
        </tr>
        </thead>
        <tr v-for="entry in groupByDescriptionAndWeek(getEntries(project.id ))">
          <td>{{ entry.description }}</td>
          <td v-for="day in entry.dates" align="right">{{ day.duration ? parseFloat(day.duration).toFixed(2) : 0 }}</td>
        </tr>

      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import {$fetch} from "ofetch";

const email = ref()
const password = ref()

const projects = ref([])
const time_entries = ref([])

async function login(){

  const data = await $fetch('/api/auth/login', {
    method: 'post',
    body: {
      email: email.value,
      password: password.value
    }
  })

  projects.value = data.projects
  time_entries.value = data.time_entries
}

function getEntries(project_id: number){
  return time_entries.value.filter(entry => entry.project_id === project_id)
}

const formatDayOfWeek = (dateStr: string) => {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
  return new Intl.DateTimeFormat('en-US', options).format(date); // Returner ugedagen som navn (fx. "Monday")
};

// Funktion til at filtrere datoer ældre end 8 dage og gruppere efter beskrivelse og dato
const groupByDescriptionAndWeek = (entries: Entry[]) => {
  const result: { description: string; dates: { day: string; duration: number | null }[] }[] = [];

  const today = new Date();

  const groupedByDescription = entries.reduce((acc: any, entry) => {
    const entryDate = new Date(entry.start.split('T')[0]);
    const diffInDays = (today.getTime() - entryDate.getTime()) / (1000 * 3600 * 24);

    // Kun inkludér datoer der er indenfor de sidste 8 dage
    if (diffInDays <= 8) {
      const dayOfWeek = formatDayOfWeek(entry.start);
      const description = entry.description;

      if (!acc[description]) {
        acc[description] = {
          description,
          dates: {
            "Monday": null,
            "Tuesday": null,
            "Wednesday": null,
            "Thursday": null,
            "Friday": null,
            "Saturday": null,
            "Sunday": null,
          },
        };
      }

      // Tilføj varighed for den pågældende dag
      acc[description].dates[dayOfWeek] = (acc[description].dates[dayOfWeek] || 0) + entry.duration / 3600; // Konverter til decimal timer
    }

    return acc;
  }, {});

  // Omdan til det ønskede array-format
  for (const key in groupedByDescription) {
    const datesArray = Object.entries(groupedByDescription[key].dates).map(([day, duration]) => ({
      day,
      duration: duration || null,
    }));

    result.push({
      description: key,
      dates: datesArray,
    });
  }

  return result;
};

</script>

<style scoped></style>
