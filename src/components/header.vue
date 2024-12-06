<script setup lang="ts"></script>
<template>
  <header>
    <nav class="navbar navbar-expand-lg bg-light">
      <div class="container-fluid">
        <NuxtLink to="/">Taskiq Admin</NuxtLink>
        <div class="collapse navbar-collapse" id="navbarSupportedContent">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <NuxtLink class="nav-link" to="/tasks">Home</NuxtLink>
            </li>
            <li class="nav-item">
              <NuxtLink class="nav-link" to="/tasks">Tasks</NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  </header>
</template>
